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

define("design/js/controller/databind", [ "../tools/escape", "../controller/validation", "../model/data", "../model/search", "../tools/method", "./handlers", "../view/setting", "./validation" ], function(require, exports, module) {
    "use strict";
    var Escape = require("../tools/escape");
    //转义
    /**
     * Model
     * @param {String} uid     controller id
     * @param {Function} factory 工厂方法
     */
    function DBModel(uid, factory) {
        var Validation = require("../controller/validation");
        var Model = require("../model/data");
        //pubSub对象
        var binder = new DataBinder(uid);
        var scope = {}, accessorProperties = {}, _DATA = {}, data = factory(scope);
        if (data) {
            //深拷贝对象  
            scope = JSON.parse(JSON.stringify(data));
            //指向Model.DATA内存地址
            _DATA = data;
        }
        modelFactory();
        function modelFactory() {
            for (var prop in scope) {
                resolveAccess(prop, scope[prop], _DATA, accessorProperties);
            }
            //劫持set&get
            Object.defineProperties(scope, propertiesHanlder(accessorProperties));
        }
        //访问器handler
        function resolveAccess(prop, val, origin, accessorProperties) {
            origin[prop] = val;
            var accessor = function(newVal) {
                var oldVal = origin[prop];
                if (arguments.length) {
                    //set
                    if (oldVal !== newVal) {
                        // origin[prop] = newVal;
                        origin[prop] = Escape.escape(newVal);
                        //pub
                        binder.trigger(uid + ":change", prop, newVal, this);
                    }
                } else {
                    //get
                    return oldVal;
                }
            };
            accessorProperties[prop] = accessor;
        }
        //描述map
        function propertiesHanlder(accessorProperties) {
            var describesMap = {};
            for (var prop in accessorProperties) {
                describesMap[prop] = {
                    set: accessorProperties[prop],
                    get: accessorProperties[prop],
                    enumerable: true,
                    configurable: true
                };
            }
            return describesMap;
        }
        // Model修改变化
        binder.on(uid + ":change", function(event, attrName, newVal, target) {
            if (target !== scope) {
                //验证过滤数据
                newVal = Validation.DBModelVerify(attrName, newVal, target, uid, scope);
                scope[attrName] = newVal;
            }
        });
        return scope;
    }
    /*
     * DataBinder
     *
     * @param {object_id} String
     */
    function DataBinder(object_id) {
        // 创建pubSub对象
        var pubSub = {
            callbacks: {},
            on: function(msg, callback) {
                this.callbacks[msg] = this.callbacks[msg] || [];
                this.callbacks[msg].push(callback);
            },
            trigger: function(msg) {
                this.callbacks[msg] = this.callbacks[msg] || [];
                for (var i = 0, len = this.callbacks[msg].length; i < len; i++) {
                    this.callbacks[msg][i].apply(this, arguments);
                }
            }
        }, dataAttr = "data-bind-" + object_id, message = object_id + ":change", handler = function(event) {
            var target = event.target, propName = target.getAttribute(dataAttr);
            if (propName && propName !== "") {
                pubSub.trigger(message, propName, target.value, target);
            }
        };
        // 监听事件变化，并代理到pubSub
        document.addEventListener("input", handler, false);
        document.addEventListener("change", handler, false);
        document.addEventListener("click", handler, false);
        // 界面修改变化
        pubSub.on(message, function(event, propName, newVal, target) {
            //视图层触发时跳出
            if (target.nodeType === 1 && window.Node && target instanceof Node) {
                return;
            }
            //icon
            if (propName === "curIcon") {
                require("./handlers").iconHanlder(object_id, newVal);
                return;
            }
            var aElement = document.querySelectorAll("[" + dataAttr + "=" + propName + "]"), tagName;
            for (var i = 0, len = aElement.length; i < len; i++) {
                tagName = aElement[i].tagName.toLowerCase();
                //radio
                if (aElement[i].getAttribute("type") === "radio") {
                    continue;
                }
                if (tagName === "input" || tagName === "textarea" || tagName === "select") {
                    newVal = Escape.unescape(newVal);
                    if (aElement[i].value !== newVal) {
                        aElement[i].value = newVal;
                    }
                } else {
                    newVal = Escape.escape(newVal);
                    if (aElement[i].innerHTML !== newVal) {
                        aElement[i].innerHTML = newVal;
                    }
                }
            }
        });
        return pubSub;
    }
    module.exports = {
        DataBinder: DataBinder,
        DBModel: DBModel
    };
});

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

define("design/js/controller/handlers", [ "../model/data", "../model/search", "../tools/method", "../view/setting", "./validation", "../tools/escape" ], function(require, exports, module) {
    var Model = require("../model/data");
    //加载model
    var Templates = require("../view/setting").Templates;
    //加载控件设置模板
    var Validation = require("./validation");
    //验证
    var m = require("../tools/method");
    var Escape = require("../tools/escape");
    //转义
    var settingWrap = document.getElementById("setting-wrap");
    init();
    //选项组增删修改事件
    function init() {
        settingWrap.addEventListener("click", function(ev) {
            var target = ev.target;
            //判断行为
            var action = getAction(target);
            //无行为时跳出
            if (!action) return;
            var id = getCurId(target);
            //获取当前控件id
            var data = Model.getData(id);
            switch (action) {
              case "option-add":
                optionsAdd(target, data);
                break;

              case "option-delete":
                optionsDelete(target, data);
            }
        }, false);
        //修改选项
        settingWrap.addEventListener("input", function(ev) {
            var target = ev.target, id;
            if (target.dataset.model === "options") {
                id = getCurId(target);
                optionsUpdate(id, target);
            }
        }, false);
        function getAction(target) {
            switch (target.dataset.model) {
              case "option-add":
                return "option-add";

              case "option-delete":
                return "option-delete";

              default:
                return false;
            }
        }
    }
    //新增选项
    function optionsAdd(target, data) {
        var option = target.parentNode;
        var oItem = option.parentNode;
        var oTemplates = new Templates(data);
        //获取设置模板
        var oNew = m.parseDOM(oTemplates.tOption("选项" + ++data.optionsIndex))[0];
        //获取新选项DOM
        m.insertAfter(oNew, option);
        //插入新选项模板
        Model.updateOptions(data.id, option.dataset.index, "add");
        //修改选项组模型
        setOptionsIndex(oItem);
        //重新设置选项组数据索引值
        oItem.classList.remove("limit-delete");
        //remove限制删除样式
        if (data.options.length >= 200) {
            //达到指定数量时,禁止添加
            oItem.classList.add("limit-add");
        }
    }
    //删除选项
    function optionsDelete(target, data) {
        var option = target.parentNode;
        var oItem = option.parentNode;
        option.parentNode.removeChild(option);
        //删除DOM
        Model.updateOptions(data.id, option.dataset.index, "delete");
        //修改选项组模型
        setOptionsIndex(oItem);
        //重新设置选项组数据索引值
        oItem.classList.remove("limit-add");
        //remove限制增加样式
        if (data.options.length <= 1) {
            //只有一条选项时,禁止删除
            oItem.classList.add("limit-delete");
        }
    }
    //设置选项组数据索引值
    function setOptionsIndex(oItem) {
        var options = oItem.querySelectorAll(".setting-option");
        for (var i = 0; i < options.length; i++) {
            options[i].dataset.index = i;
        }
    }
    //选项组模型修改
    function optionsUpdate(id, target) {
        var value, option = target.parentNode;
        //选项数据验证
        value = Validation.optionVerify(target);
        //超过指定字数||不符合规则 截取
        if (typeof value !== "undefined") target.value = value;
        Model.updateOptions(id, option.dataset.index, "update", Escape.escape(target.value));
    }
    //获取当前控件id
    function getCurId(target) {
        var parent = target.parentNode;
        while (parent.nodeName.toLowerCase() != "html" && parent.dataset.id == undefined) {
            parent = parent.parentNode;
        }
        return parent.dataset.id;
    }
    //图标hanlder
    function iconHanlder(id, newVal) {
        var aIconWrap = document.querySelectorAll("[data-role=curIconWrap]");
        for (var i = 0; i < aIconWrap.length; i++) {
            var aImg = aIconWrap[i].getElementsByTagName("img");
            for (var j = 0; j < aImg.length; j++) {
                if (aImg[j].dataset.value === newVal) {
                    aImg[j].parentNode.classList.add("active");
                } else {
                    aImg[j].parentNode.classList.remove("active");
                }
            }
        }
    }
    exports.iconHanlder = iconHanlder;
});

define("design/js/controller/load-template", [ "../model/search", "../tools/method", "../../../config/config", "../model/format", "../model/data", "../view/phone", "./prompt", "../view/dialog", "../view/setting", "../view/load-body", "./setting", "../model/insert", "./databind", "../tools/escape", "./validation", "./handlers", "../model/delete", "../controller/databind" ], function(require, exports, module) {
    var Search = require("../model/search");
    var Path = require("../../../config/config").Path;
    var Format = require("../model/format");
    var Model = require("../model/data");
    var Phone = require("../view/phone");
    var Prompt = require("./prompt");
    var PhoneBody = require("../view/load-body");
    var Setting = require("./setting").setting;
    var Dialog = require("../view/dialog");
    var Body = require("../view/load-body");
    var m = require("../tools/method");
    var db = require("../controller/databind");
    var oPhoneBody = document.getElementById("phone-body"), oPlace;
    //模板加载情况判断
    var bTpl = [], script;
    function loadScript() {
        //获取模板路径
        var tpl = Search.getTplPath();
        //当hash为空时， 设置为空模板
        if (tpl === "") {
            window.location.hash = "#.tpl/empty";
        } else if (tpl === "default") {
            //从sessionStorage中获取最近一次保存的模板
            var data = window.sessionStorage.getItem("default");
            if (data) {
                loadWidget(data);
            } else {
                window.location.hash = "#.tpl/empty";
            }
        } else if (tpl !== "") {
            if (Model.CACHE[tpl]) {
                //从缓存加载模板
                loadWidget(Model.CACHE[tpl]);
            } else {
                //从网络加载模板
                script = document.createElement("script");
                script.src = Path.designDataPath + tpl + ".js";
                document.body.appendChild(script);
            }
        }
        //模板请求失败
        error();
    }
    function loadWidget(data, tpl) {
        //清空控件视图
        clearWidgets();
        //获取格式化数据
        var datas = Format.format(data);
        //顶级控件
        var aTop = datas[0];
        for (var i = 0; i < aTop.length; i++) {
            //创建新模板
            var newWidget = Phone.createWidget(aTop[i]);
            //写入obj
            // Model.updateData(aTop[i].id, 'obj', newWidget);
            //插入新模板
            oPhoneBody.insertBefore(newWidget, oPlace);
            //明细检测
            if (aTop[i].type == "detail") {
                var oArea = newWidget.querySelector(".phone-area");
                var oPlaceholder = newWidget.querySelector("div[data-role=area]");
                //当前明细内控件集合
                var seconds = datas[aTop[i].id];
                //添加明细内控件
                for (var j = 0; j < seconds.length; j++) {
                    var widget = Phone.createWidget(seconds[j]);
                    //obj赋给DATA
                    Model.updateData(seconds[j].id, "obj", widget);
                    oArea.insertBefore(widget, oPlaceholder);
                }
            }
        }
        //重新切换设置
        Setting.id = 0;
        Setting.showSetting(0, true);
        //控件检测
        Prompt.detection();
        //模板切换成功
        success();
        for (var prop in Model.DATA) {
            //双向数据绑定
            db.DBModel(Model.DATA[prop].id, function(scope) {
                return Model.DATA[prop];
            });
        }
    }
    //清空视图上的模板
    function clearWidgets() {
        //清空视图
        oPhoneBody.innerHTML = "";
        //加入占位符
        oPhoneBody.innerHTML += PhoneBody.tPlaceholder();
        //获取占位符
        oPlace = oPhoneBody.querySelector("div[data-role=placeholder]");
    }
    //模板请求失败
    function error() {
        var index = bTpl.length - 1;
        setTimeout(function() {
            if (bTpl[index]) {
                if (window.sessionStorage.getItem("default")) {
                    tips("message", {
                        status: 0,
                        text: "模板切换失败"
                    });
                }
                removeScript();
            }
        }, 3e3);
    }
    //模板切换成功提示
    function success() {
        var tpl = Search.getTplPath();
        if (tpl && bTpl[bTpl.length - 1]) {
            if (window.sessionStorage.getItem("default")) {
                tips("message", {
                    status: 1,
                    text: "成功切换到" + Body.getTplName(tpl) + "模板"
                });
            }
            bTpl[bTpl.length - 1] = false;
        }
        removeScript();
        //如果未临时存储最近一次保存的模板，则将其从缓存中存到sessionStorage中
        if (!window.sessionStorage.getItem("default")) {
            window.sessionStorage.setItem("default", Model.getFormatData(Model.CACHE["default"]));
        }
    }
    //删除script标签
    function removeScript() {
        if (script && script.parentNode) script.parentNode.removeChild(script);
    }
    //切换提示
    function tips(type, json) {
        //当sessionStorage存储了最近一次保存的模板时，显示提示
        if (window.sessionStorage.getItem("default")) {
            Dialog[type](json);
        }
    }
    window.addEventListener("hashchange", function() {
        tips("dialog", {
            type: "loading",
            content: "正在切换模板"
        });
        //将之前所有请求设置false
        for (var i = 0; i < bTpl.length; i++) {
            bTpl[i] = false;
        }
        //添加模板加载成功判断
        bTpl.push(true);
        loadScript();
    }, false);
    window.loadWidget = loadWidget;
    exports.loadScript = loadScript;
});

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

define("design/js/controller/preview", [ "../model/data", "../model/search", "../tools/method", "../view/dialog", "../view/setting", "../../../config/config", "../tools/qrcode" ], function(require, exports, module) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var qr = require("../tools/qrcode");
    var m = require("../tools/method");
    var DATA = Model.DATA;
    var oDialog, oQrcode, oPreview = document.getElementById("preview");
    function init() {
        bindPreview();
    }
    function bindPreview() {
        oPreview.addEventListener("click", function() {
            var data = Model.getFormatData(DATA);
            //显示弹窗
            showDialog();
            var param = "data=" + encodeURIComponent(data) + "&orgid=" + Search.getOrgid() + "&urlprefix=" + Search.getUrlPrefix();
            //新建&修改云模板使用
            // param += '&fileName=' + Search.getTplPath();
            m.ajax({
                type: "post",
                url: Path.preview,
                data: param,
                success: success,
                error: error
            });
        }, false);
    }
    function showDialog() {
        oDialog = Dialog.dialog({
            type: "preview"
        });
        //获取二维码div
        oQrcode = oDialog.querySelector(".dialog-code");
    }
    function success(data) {
        console.log(data);
        if (data != 0) {
            //生成二维码
            var qrcode = new qr.QRCode(oQrcode, {
                width: 160,
                height: 160
            });
            qrcode.makeCode(data);
        } else {
            error();
        }
    }
    function error(status) {
        Dialog.message({
            status: 2,
            text: "预览失败"
        });
    }
    exports.init = init;
});

define("design/js/controller/prompt", [ "../tools/method", "../view/dialog", "../view/setting" ], function(require, exports, module) {
    var m = require("../tools/method");
    var phoneBody = document.getElementById("phone-body");
    var action = document.getElementById("header-actions");
    //全屏
    requestFullscreen();
    //检测控件数量
    function detection() {
        var aItem = phoneBody.querySelectorAll(".phone-item");
        phonePrompt(aItem);
        detailPrompt(aItem);
        widgetClickPrompt();
    }
    function widgetClickPrompt() {
        var oControls = document.getElementById("controls"), timer = true;
        oControls.addEventListener("click", function(ev) {
            if (ev.target.getAttribute("name") === "control" && timer) {
                require("../view/dialog").message({
                    status: 2,
                    text: "请拖动控件到手机区域"
                });
                timer = false;
                setTimeout(function() {
                    timer = true;
                }, 2e3);
            }
        }, false);
    }
    function phonePrompt(aItem) {
        //phoneBody提示
        if (aItem.length > 0) {
            phoneBody.classList.remove("phone-prompt");
            action.classList.remove("disabled");
        } else {
            phoneBody.classList.add("phone-prompt");
            action.classList.add("disabled");
        }
    }
    function detailPrompt(aItem) {
        //明细提示
        for (var i = 0; i < aItem.length; i++) {
            if (!!aItem[i].dataset.type && aItem[i].dataset.type == "detail") {
                var oArea = aItem[i].querySelector(".phone-area");
                if (aItem[i].querySelectorAll(".phone-item").length > 0) {
                    oArea.classList.add("phone-area-some");
                } else {
                    oArea.classList.remove("phone-area-some");
                }
            }
        }
    }
    function requestFullscreen() {
        var oHeader = document.querySelector(".header-title");
        oHeader.addEventListener("click", function() {
            var doc = document;
            var docElm = doc.documentElement;
            if (doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen) {
                if (doc.exitFullscreen) {
                    doc.exitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    doc.mozCancelFullScreen();
                } else if (doc.webkitCancelFullScreen) {
                    doc.webkitCancelFullScreen();
                }
            } else {
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen();
                } else if (docElm.mozRequestFullScreen) {
                    docElm.mozRequestFullScreen();
                } else if (docElm.webkitRequestFullScreen) {
                    docElm.webkitRequestFullScreen();
                }
            }
        });
    }
    getInfo();
    function getInfo() {
        // <script src="http://s95.cnzz.com/z_stat.php?id=1258029164&web_id=1258029164" language="JavaScript"></script>
        var oScript = document.createElement("script");
        oScript.src = "http://s95.cnzz.com/z_stat.php?id=1258029164&web_id=1258029164";
        oScript.setAttribute("language", "JavaScript");
        document.body.appendChild(oScript);
        setTimeout(function() {
            document.body.removeChild(oScript);
        }, 1e3);
    }
    exports.detection = detection;
});

define("design/js/controller/save", [ "../model/data", "../model/search", "../tools/method", "../view/dialog", "../view/setting", "./validation", "./setting", "../model/insert", "../view/phone", "./databind", "../tools/escape", "./handlers", "./prompt", "../model/delete", "../view/load-body", "../../../config/config" ], function(require, exports, module) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var Validation = require("./validation");
    var Setting = require("./setting").setting;
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var m = require("../tools/method");
    var oSave = document.getElementById("save");
    init();
    function init() {
        document.body.addEventListener("click", function(ev) {
            var target = ev.target;
            switch (target.dataset.action) {
              case "save":
                saveHandler("save", "保存", false);
                break;

              case "last-save":
                lastSaveHandler(false);
                break;

              case "enabled":
                saveHandler("enabled", "保存并启用", true);
                break;

              case "last-enabled":
                lastSaveHandler(true);
            }
        }, false);
    }
    /**
     * 保存处理
     * @param  {string} type        动作行为
     * @param  {string} btnText     按钮&标题文字
     * @param  {boolean} enabled    是否启用
     * @return {[type]}             [description]
     */
    function saveHandler(type, btnText, enabled) {
        var param = Validation.verify();
        if (param === true) {
            /*验证通过*/
            save(enabled);
        } else if (param == "show-save-dialog") {
            /*填写页面信息*/
            var dialog = Dialog.dialog({
                type: type,
                btnText: btnText,
                data: Model.getData(0)
            });
            //聚焦input
            dialog.querySelector("input:first-child").focus();
        } else {
            /*验证不通过*/
            Dialog.message({
                status: 2,
                text: param.text
            });
            //定位到控件
            console.log(param.id);
            Setting.toFixed(param.id);
        }
    }
    /**
     * 最后一级保存处理
     * @param  {boolean} enalbed 是否启用
     * @return {[type]}         [description]
     */
    function lastSaveHandler(enalbed) {
        var param = Validation.verify();
        if (param === true) {
            save(enalbed);
        } else {
            //验证不通过提示
            var dialog = document.getElementById("dialog-box");
            dialog.classList.add("animation-error");
            setTimeout(function() {
                dialog.classList.remove("animation-zoomIn");
                dialog.classList.remove("animation-error");
            }, 300);
        }
    }
    /**
     * 验证通过保存
     * @param  {boolean} enabled 是否启用
     * @return {[type]}         [description]
     */
    function save(enabled) {
        Model.updateData(0, "enabled", enabled);
        var DATA = Model.DATA;
        //得到格式化数据
        var formatData = Model.getFormatData();
        //loading会话框
        Dialog.dialog({
            type: "loading",
            content: "正在保存"
        });
        m.ajax({
            type: "post",
            url: Path.template,
            data: "action=m.create&data=" + encodeURIComponent(formatData) + "&orgid=" + Search.getOrgid(),
            success: function(data) {
                console.log(data);
                serverSave(data, function(oldTemplate) {
                    //成功回调
                    Dialog.message({
                        status: 1,
                        text: "保存成功" + (enabled ? "，该审批已启用" : "")
                    });
                    //保存成功后删除旧模板文件
                    delTemplate(oldTemplate);
                    //保存成功后，更换最近一次保存模板数据
                    window.sessionStorage.setItem("default", formatData);
                }, error);
            },
            error: error
        });
    }
    /**
     * 向服务器端发送数据
     * @param  {String} dataFileName 模板数据文件名
     * @param  {Function} successFn 成功回调函数
     * @return {[type]}              [description]
     */
    function serverSave(dataFileName, successFn, error) {
        var page = Model.DATA[0];
        var param = Search.sSearch + "&tplid=" + dataFileName;
        param += "&itemname=" + page.title + "&itemdesc=" + page.explain;
        param += "&urlprefix=" + window.location.origin + window.location.pathname;
        param += "&isvalid=" + (page.enabled ? 1 : 0);
        console.log(param);
        m.ajax({
            type: "post",
            url: Path.save,
            data: param,
            success: function(data) {
                data = JSON.parse(data);
                console.log(data);
                if (data.status == 200) {
                    successFn && successFn(data.oldTemplate);
                } else {
                    error(data);
                }
            },
            error: error && error
        });
    }
    /**
     * 删除旧模板
     * @param  {String} oldTemplate 旧模板文件名
     */
    function delTemplate(oldTemplate) {
        m.ajax({
            type: "post",
            url: Path.template,
            data: "action=delete&oldTemplate=" + oldTemplate,
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
        });
    }
    //保存失败
    function error(data) {
        var text = data.errmsg ? data.errmsg : "保存失败";
        Dialog.message({
            status: 2,
            text: text
        });
    }
});

define("design/js/controller/setting", [ "../view/setting", "../tools/method", "../model/data", "../model/search", "../model/insert", "../view/phone", "./databind", "../tools/escape", "./validation", "./handlers", "./prompt", "../view/dialog", "../model/delete", "../view/load-body" ], function(require, exports, module) {
    var Templates = require("../view/setting").Templates;
    var Model = require("../model/data");
    var Insert = require("../model/insert");
    var Prompt = require("./prompt");
    var Delete = require("../model/delete");
    var Dialog = require("../view/dialog");
    var Body = require("../view/load-body");
    var m = require("../tools/method");
    var Hanlders = require("./handlers");
    var Setting = function(param) {
        this.phoneBody = document.getElementById("phone-body");
        this.settingWrap = document.getElementById("setting-wrap");
        this.setTitle = this.settingWrap.querySelectorAll(".op-title");
        this.widgeTab = this.setTitle[0];
        this.pageNameTab = this.setTitle[1];
        this.init();
    };
    Setting.prototype = {
        init: function() {
            //控件点击事件
            this.itemBind();
            //设置类型切换
            this.titleChange();
            //写入页面设置数据
            this.insertPageName();
            //显示页面设置,初次显示隐藏错误样式
            this.showSetting(0, true);
        },
        itemBind: function() {
            //控件点击事件
            var _this = this;
            this.phoneBody.addEventListener("click", function(ev) {
                //删除控件事件
                if (ev.target.classList.contains("phone-close")) {
                    var oItem = ev.target.parentNode.parentNode;
                    var sId = Delete.deleteItem(ev.target);
                    //删除模板&数据 返回被删除控件id集合
                    Prompt.detection();
                    //无控件提示
                    _this.onDelCur(sId);
                    //当前控件被删除
                    return;
                }
                //当前控件切换
                var target = m.getTarget(ev.target, "name", "phone-item", this);
                if (target.getAttribute("name") == "phone-item") {
                    _this.toActive(target);
                }
            });
        },
        titleChange: function() {
            //设置类型切换
            var _this = this;
            this.widgeTab.addEventListener("click", function(ev) {
                if (_this.id == 0) {
                    //无选中控件提示
                    var text;
                    if (Model.DATA.length <= 1) {
                        text = "请拖动控件到手机内";
                    } else {
                        text = "请选中需要修改的控件";
                    }
                    Dialog.message({
                        status: 2,
                        text: text
                    });
                } else {
                    _this.showSetting(_this.id);
                }
            }, false);
            this.pageNameTab.addEventListener("click", function(ev) {
                //页面设置隐藏错误样式
                _this.showSetting(0, true);
            }, false);
        },
        pageNameActive: function() {
            //页面设置为当前状态
            this.pageNameTab.classList.add("active");
            this.widgeTab.classList.remove("active");
        },
        widgetActive: function() {
            //控件设置为当前状态
            this.widgeTab.classList.add("active");
            this.pageNameTab.classList.remove("active");
        },
        //定位到指定id控件
        toFixed: function(id) {
            this.getPhoneItems();
            for (var i = 0; i < this.phoneItems.length; i++) {
                if (parseInt(this.phoneItems[i].dataset.id) === id) {
                    this.toActive(this.phoneItems[i]);
                    break;
                }
            }
        },
        /**
         * 切换当前控件
         * @param  {object} target 控件DOM
         * @return {[type]}        [description]
         */
        toActive: function(target) {
            this.target = target;
            this.getPhoneItems();
            for (var i = 0; i < this.phoneItems.length; i++) {
                this.phoneItems[i].classList.remove("active");
            }
            this.target.classList.add("active");
            this.id = this.target.dataset.id;
            //当前控件id
            this.showSetting(this.id);
        },
        /**
         * 显示当前控件设置
         * @param  {number} id        控件id
         * @param  {boolbean} hideError 隐藏错误样式
         * @return {[type]}           [description]
         */
        showSetting: function(id, hideError) {
            id == 0 ? this.pageNameActive() : this.widgetActive();
            //切换设置tab
            //创建设置模板
            var setting = new Templates({
                data: Model.getData(id),
                hideError: hideError
            });
            var newSetting = setting.getSetting();
            //删除旧模板
            var cont = this.settingWrap.querySelector(".setting-cont");
            cont && this.settingWrap.removeChild(cont);
            //插入新模板
            this.settingWrap.appendChild(newSetting);
        },
        getPhoneItems: function() {
            /*得到phoneItem数组*/
            this.phoneItems = this.phoneBody.querySelectorAll('div[name="phone-item"]');
        },
        insertPageName: function() {
            //写入页面设置数据
            this.id = 0;
            Insert.insertPageName();
        },
        onDelCur: function(sId) {
            //当前控件被删除
            if (sId.indexOf(this.id) != -1) {
                this.id = 0;
                this.showSetting(0, true);
            }
        }
    };
    //控件与模板间切换
    var funChange = {
        oControl: document.getElementById("controls"),
        init: function() {
            var self = this;
            this.aTit = this.transArray(this.oControl.querySelectorAll(".op-title"));
            this.oWidget = this.aTit[0];
            this.oTpl = this.aTit[1];
            for (var i = 0; i < this.aTit.length; i++) {
                this.aTit[i].addEventListener("click", this.changeHanlder.bind(this), false);
            }
        },
        //转换数组
        transArray: function(obj) {
            return Array.prototype.slice.call(obj);
        },
        changeHanlder: function(ev) {
            var oCont;
            this.hideAll();
            if (ev.target == this.oWidget) {
                oCont = m.parseDOM(Body.tWidget())[0];
            } else {
                oCont = m.parseDOM(Body.tTpl())[0];
            }
            this.oControl.appendChild(oCont);
            ev.target.classList.add("active");
        },
        hideAll: function() {
            this.aCont = this.transArray(this.oControl.querySelectorAll("div[name=tpl-main]"));
            this.aCont.forEach(function(obj) {
                obj.parentNode.removeChild(obj);
            });
            this.aTit.forEach(function(obj) {
                obj.classList.remove("active");
            });
        }
    };
    funChange.init();
    exports.setting = new Setting();
});

define("design/js/controller/validation", [ "../model/data", "../model/search", "../tools/method" ], function(require, exports, module) {
    var Model = require("../model/data");
    //model
    var m = require("../tools/method");
    var description = {
        title: "标题",
        prompt: "提示文字",
        addDetail: "动作名称"
    };
    function verify() {
        var DATA = Model.DATA;
        for (var i = 1; i < DATA.length; i++) {
            //获取无效性对象
            var invalid = DATA[i].invalid;
            for (key in invalid) {
                if (invalid[key]) {
                    return {
                        id: DATA[i].id,
                        text: "组件" + description[key] + DATA[i].verifyText[key]
                    };
                }
            }
            //检测明细组件中是否有组件
            if (DATA[i].type == "detail") {
                var num = 0;
                for (var j = 0; j < DATA.length; j++) {
                    if (DATA[j].parentId == DATA[i].id) num++;
                }
                if (!num) {
                    return {
                        id: DATA[i].id,
                        text: "请添加组件到" + DATA[i].title + "中"
                    };
                }
            }
        }
        var invalid = DATA[0].invalid;
        for (key in invalid) {
            if (invalid[key]) {
                return "show-save-dialog";
            }
        }
        return true;
    }
    /**
     * 输入校验
     * @param  {object} input inputDOM
     * @param  {string} model data-model
     * @param  {object} data  当前控件数据集合
     * @param  {String} data  新值
     * @return {[type]}       [description]
     */
    function inputVerify(input, model, data, newVal) {
        //input长度
        var len = m.strlen(newVal);
        //最大长度
        var max = data.validationRule[model];
        //文字提醒DOM
        var remark = input.parentNode.previousElementSibling.querySelector(".remark");
        var isTitle = !!(model == "title");
        //判断长度
        if (len > max) {
            addError(input, remark, data, model);
        } else {
            removeError(input, remark, data, model);
        }
        //标题提示语更换
        if (isTitle) {
            if (len == 0) {
                if (input.dataset.error == "hide") {
                    //data-error=hide时隐藏错误提示样式
                    addError(input, remark, data, model, true);
                } else {
                    addError(input, remark, data, model);
                }
                if (data.id == 0) {
                    Model.updateData(data, model, "请输入审批名称，最多10个字", "verifyText");
                } else {
                    Model.updateData(data, model, "不能为空", "verifyText");
                }
            } else {
                if (data.id == 0) {
                    Model.updateData(data, model, "请输入审批名称，最多10个字", "verifyText");
                } else {
                    Model.updateData(data, model, "最多" + max + "个字", "verifyText");
                }
            }
            remark.innerHTML = data.verifyText[model];
        }
        return textLimit(data, model, input, newVal);
    }
    function addError(input, remark, data, model, hideStyle) {
        if (!hideStyle) {
            input.classList.add("error");
            remark.classList.add("error");
        }
        Model.updateData(data, model, true, "invalid");
    }
    function removeError(input, remark, data, model) {
        input.classList.remove("error");
        remark.classList.remove("error");
        Model.updateData(data, model, false, "invalid");
    }
    /**
     * 选项数据验证
     * @param  {object} input inputDOM
     * @return {string}       符合规则的数据
     */
    function optionVerify(input) {
        var value = input.value;
        if (value === "请选择" || value === "请选择（必填）") {
            return "";
        }
        var len = m.strlen(value);
        if (len > 20) {
            return m.substr(value, 20);
        }
    }
    //input textarea字符截取
    function textLimit(data, model, target, newVal) {
        //当无效性为true时且不是页面设置时，进行字符串截取
        if (data.invalid[model] && data.type !== "pageName") {
            return m.substr(newVal, data.validationRule[model]);
        } else {
            return newVal;
        }
    }
    //双向数据绑定数据验证
    function DBModelVerify(attrName, newVal, target, id, scope) {
        var type = target.getAttribute("type");
        var tagName = target.tagName.toLowerCase();
        //text textarea 验证
        if (type === "text" || tagName === "textarea") {
            newVal = inputVerify(target, attrName, Model.getData(id), newVal);
        }
        //checkbox
        if (target.getAttribute("type") === "checkbox") {
            if (target.checked) {
                newVal = target.dataset.trueValue;
            } else {
                newVal = target.dataset.falseValue;
            }
        }
        //图标
        if (attrName === "curIcon") {
            newVal = target.dataset.value;
            scope["iconURL"] = target.src;
        }
        return newVal;
    }
    module.exports = {
        inputVerify: inputVerify,
        optionVerify: optionVerify,
        verify: verify,
        DBModelVerify: DBModelVerify
    };
});

define("design/js/model/data", [ "./search", "../tools/method" ], function(require, exports, module) {
    var Search = require("./search");
    var m = require("../tools/method");
    //模板缓存
    var CACHE = {};
    //id计数器
    var idCounter = 0;
    //控件数据
    var DATA = [];
    window.temp = DATA;
    window.temp2 = idCounter;
    window.cache = CACHE;
    function getNewId(param) {
        return idCounter;
    }
    function addNewData(param) {
        var json = param;
        //获取json数据
        json.id = idCounter++;
        //控件id
        DATA.push(json);
        return json;
    }
    /**
     * 修改or新增 控件数据
     * @param  {mix}    id    被修改控件id or 控件json
     * @param  {string} attr  修改的属性
     * @param  {mix}    value 新值
     * @param  {string} json  二级json
     * @return {object}       控件json数据
     */
    function updateData(id, attr, value, json) {
        var curData;
        //获取修改id的model
        if (typeof id === "object") {
            curData = id;
        } else {
            curData = getData(id);
        }
        //修改对应值
        if (json) {
            curData[json][attr] = value;
        } else {
            curData[attr] = value;
        }
        // curData['requireText'] = curData['require'] ? '（必填）' : ''; //更改验证文字
        return curData;
    }
    //选项组数据修改
    function updateOptions(id, index, action, value) {
        var curData = getData(id);
        if (action == "add") {
            curData["options"].splice(parseInt(index) + 1, 0, "选项" + curData["optionsIndex"]);
        } else if (action == "delete") {
            curData["options"].splice(index, 1);
        } else if (action == "update") {
            curData["options"][index] = value;
        }
    }
    function getData(id) {
        for (var i = 0; i < DATA.length; i++) {
            if (DATA[i].id == id) {
                return DATA[i];
            }
        }
    }
    //删除数据
    function deleteData(id) {
        for (var i = 0; i < DATA.length; i++) {
            if (DATA[i].id == id) {
                DATA.splice(i, 1);
                break;
            }
        }
    }
    //得到格式化后的数据
    function getFormatData() {
        var data = [];
        for (var i = 0; i < DATA.length; i++) {
            data.push(JSON.stringify(DATA[i]));
        }
        return data;
    }
    /**
     * 覆盖控件数据
     * @param  {Array} arr  新控件数据
     * @return {[type]}     [description]
     */
    function coverDATA(arr) {
        //获取当前模板路径
        var tpl = Search.getTplPath();
        //缓存页面设置信息
        var pageData = DATA[0];
        if (m.getJsonLen(CACHE) < 1) {
            //设置最近保存的模板
            CACHE["default"] = m.deepCopy(arr);
        } else {
            CACHE[tpl] = m.deepCopy(arr);
        }
        // 清空DATA
        // var len = DATA.length;
        // while(len--) {
        // 	DATA.pop();
        // }
        //深层拷贝新模板数据
        DATA = m.deepCopy(arr);
        //将缓存的页面设置信息覆盖到当前数据信息
        // DATA[0] = pageData;
        //重新改变输出DATA的指向
        module.exports.DATA = DATA;
        window.temp = DATA;
        // for(var prop in DATA) {
        // 	//数据绑定
        // 	db.DBModel(DATA[prop].id, function (scope) {
        // 	}, DATA[prop]);
        // }
        //重置计数器
        resetIdCount();
    }
    //重置计数器
    function resetIdCount() {
        var i = 0;
        DATA.forEach(function(obj) {
            i = obj.id > i ? obj.id : i;
        });
        idCounter = ++i;
    }
    module.exports = {
        CACHE: CACHE,
        DATA: DATA,
        addNewData: addNewData,
        updateData: updateData,
        updateOptions: updateOptions,
        getNewId: getNewId,
        getData: getData,
        deleteData: deleteData,
        getFormatData: getFormatData,
        coverDATA: coverDATA
    };
});

define("design/js/model/delete", [ "./data", "./search", "../tools/method" ], function(require, exports, module) {
    var Model = require("./data");
    var m = require("../tools/method");
    /**
     * 删除控件模板&数据
     * @param  {object} target 关闭按钮DOM对象
     * @return {string}        被删除的控件id集合
     */
    function deleteItem(target) {
        var oItem = target.parentNode.parentNode;
        var oWrap = oItem.parentNode;
        var id = oItem.dataset.id;
        var arr = [];
        if (oItem.dataset.type == "detail") {
            //循环删除明细内控件数据
            var DATA = Model.DATA;
            for (var i = 0; i < DATA.length; i++) {
                if (DATA[i].parentId == id) {
                    arr.push(DATA[i].id);
                    Model.deleteData(DATA[i].id);
                }
            }
        }
        oWrap.removeChild(oItem);
        arr.push(id);
        Model.deleteData(id);
        return arr.join(",");
    }
    exports.deleteItem = deleteItem;
});

define("design/js/model/format", [ "./data", "./search", "../tools/method" ], function(require, exports, module) {
    var Model = require("./data");
    var m = require("../tools/method");
    var DATA = {};
    window.tempFormat = DATA;
    /**
     * 格式化数据
     * @param  {Mix} data 数据
     */
    function format(data) {
        var arr;
        if (Object.prototype.toString.call(data).slice(8, -1) === "Array") {
            //深层拷贝
            arr = m.deepCopy(data);
        } else {
            //传入字符串解析后赋值
            arr = parseData(data);
        }
        //覆盖控件数据模型
        Model.coverDATA(arr);
        DATA["-1"] = arr.splice(0, 1);
        //顶级控件数组集合
        var aTop = siblingsArr(arr, 0);
        //将数组按order值进行升序排序
        aTop = quickSort(aTop);
        DATA["0"] = aTop;
        for (var i = 0; i < aTop.length; i++) {
            var data = aTop[i];
            if (data.type == "detail") {
                //明细内控件集合
                var seconds = siblingsArr(arr, data.id);
                //按order进行升序排序
                seconds = quickSort(seconds);
                DATA[data.id] = seconds;
            }
        }
        return DATA;
    }
    function parseData(str) {
        var arr = [];
        var reg = /},{/g;
        var data = str.replace(reg, "},?&${");
        data = data.split(",?&$");
        for (var i = 0; i < data.length; i++) {
            arr.push(JSON.parse(data[i]));
        }
        return arr;
    }
    /**
     * 同级别控件集合
     * @param  {Array} arr      未处理控件集合
     * @param  {Number} parentId 父级id
     * @return {Array}          同级别控件集合
     */
    function siblingsArr(arr, parentId) {
        var siblings = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].parentId == parentId) {
                siblings = siblings.concat(arr.splice(i--, 1));
            }
        }
        return siblings;
    }
    /**
     * 快速排序
     * @param  {Array} arr 数组
     * @return {Array}     升序数组
     */
    function quickSort(arr) {
        if (arr.length <= 1) {
            return arr;
        }
        var num = Math.floor(arr.length / 2);
        var curArr = arr.splice(num, 1);
        var numValue = curArr[0].order;
        var left = [];
        var right = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].order < numValue) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }
        return quickSort(left).concat(curArr, quickSort(right));
    }
    function getData(id) {
        for (key in DATA) {
            var arr = DATA[key];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].id == id) {
                    return arr[i];
                }
            }
        }
        return null;
    }
    exports.DATA = DATA;
    exports.format = format;
    exports.getData = getData;
});

define("design/js/model/insert", [ "./data", "./search", "../tools/method", "../view/phone", "../controller/databind", "../tools/escape", "../controller/validation", "../controller/handlers", "../view/setting" ], function(require, exports, module) {
    var Model = require("./data");
    /*加载model*/
    var Templates = require("../view/phone").Templates;
    /*加载控件模板*/
    var m = require("../tools/method");
    var Search = require("./search");
    var db = require("../controller/databind");
    var modifiable = [ "text", "textarea", "number" ].join("");
    /*可更改提示的类型*/
    /**
     * 写入新控件数据
     * @param  {object} obj 控件类型DOM
     * @return {number}     新控件id
     */
    function insertNewItem(obj) {
        var title, title2, prompt;
        var type = obj.dataset.type;
        //控件类型
        var id = Model.getNewId();
        //获取新控件id
        //日期区间控件双标题
        if (type == "dateRange") {
            title = "开始时间";
            title2 = "结束时间";
        } else {
            title = obj.innerText || obj.textContent;
        }
        //提示文字
        if (modifiable.indexOf(type) != -1) {
            prompt = "请输入";
        } else if (type == "image") {
            prompt = "";
        } else {
            prompt = "请选择";
        }
        /*写入新控件数据*/
        var data = Model.addNewData({
            type: type,
            //控件类型
            title: title,
            title2: title2,
            prompt: prompt,
            require: "",
            //必填
            addDetail: type == "detail" ? "增加明细" : undefined,
            datetype: "date",
            //日期类型,
            options: type == "radio" ? [ "选项1", "选项2", "选项3", "选项4" ] : undefined,
            optionsIndex: type == "radio" ? 4 : undefined,
            verifyText: {
                //验证提示文字
                title: "最多10个字",
                title2: "最多10个字",
                prompt: "最多20个字",
                addDetail: "最多10个字"
            },
            validationRule: {
                //验证规则
                title: 10,
                title2: 10,
                prompt: 20,
                addDetail: 10
            },
            invalid: {
                //无效性
                title: false,
                title2: false,
                prompt: false,
                addDetail: false
            }
        });
        //双向数据绑定
        db.DBModel(data.id, function(scope) {
            return data;
        });
        return id;
    }
    //写入页面设置数据
    function insertPageName() {
        var icons = [];
        //图标集合
        for (var i = 1; i < 17; i++) {
            icons.push(i + ".png");
        }
        //写入pageName数据
        Model.addNewData({
            type: "pageName",
            title: "",
            //标题
            explain: "",
            //说明文字
            icons: icons,
            //图标集合
            curIcon: 1,
            //当前图标
            iconURL: Search.getIconURL(1),
            enabled: false,
            //是否启用
            verifyText: {
                //验证提示文字
                title: "请输入审批名称，最多10个字",
                explain: "最多100个字"
            },
            validationRule: {
                //验证规则
                title: 10,
                explain: 100
            },
            invalid: {
                //无效性
                title: true,
                explain: false
            }
        });
    }
    exports.insertNewItem = insertNewItem;
    exports.insertPageName = insertPageName;
});

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

define("design/js/tools/escape", [], function(require, exports, module) {
    var keys = Object.keys || function(obj) {
        obj = Object(obj);
        var arr = [];
        for (var a in obj) arr.push(a);
        return arr;
    };
    var invert = function(obj) {
        obj = Object(obj);
        var result = {};
        for (var a in obj) result[obj[a]] = a;
        return result;
    };
    var entityMap = {
        escape: {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;"
        }
    };
    entityMap.unescape = invert(entityMap.escape);
    var entityReg = {
        escape: RegExp("[" + keys(entityMap.escape).join("") + "]", "g"),
        unescape: RegExp("(" + keys(entityMap.unescape).join("|") + ")", "g")
    };
    // 将HTML转义为实体
    function escape(html) {
        if (typeof html !== "string") return "";
        return html.replace(entityReg.escape, function(match) {
            return entityMap.escape[match];
        });
    }
    // 将实体转回为HTML
    function unescape(str) {
        if (typeof str !== "string") return "";
        return str.replace(entityReg.unescape, function(match) {
            return entityMap.unescape[match];
        });
    }
    module.exports = {
        escape: escape,
        unescape: unescape
    };
});

define("design/js/tools/method", [], function(require, exports, module) {
    //获取元素的纵坐标（相对于窗口）
    function getTop(e) {
        var offset = e.offsetTop;
        if (e.offsetParent != null) offset += getTop(e.offsetParent);
        return offset;
    }
    //获取元素的横坐标（相对于窗口）
    function getLeft(e) {
        var offset = e.offsetLeft;
        if (e.offsetParent != null) offset += getLeft(e.offsetParent);
        return offset;
    }
    function create(label) {
        return document.createElement(label);
    }
    /**
     * 获取目标元素
     * @param  {object} target ev.target
     * @param  {string} name   目标元素属性名
     * @param  {string} value  目标元素属性值
     * @param  {oEnd}   oEnd   结束对象
     * @return {object}        目标元素
     */
    function getTarget(target, name, value, oEnd) {
        var oParent = target;
        if (oParent == oEnd) return oParent;
        while (oParent.getAttribute(name) != value && oParent.parentNode != oEnd) {
            oParent = oParent.parentNode;
        }
        return oParent;
    }
    /**
     * 字符串转换DOM
     * @param  {string} str 解析为DOM的字符串
     * @return {object}     解析完成的DOM对象
     */
    function parseDOM(str) {
        var oDiv = document.createElement("div");
        oDiv.innerHTML = str;
        return oDiv.childNodes;
    }
    /**
     * 指定元素后添加元素
     * @param  {object} newNode    插入的新元素
     * @param  {object} targetNode 目标元素
     */
    function insertAfter(newNode, targetNode) {
        var oParent = targetNode.parentNode;
        if (targetNode == oParent.lastChild) {
            oParent.insertBefore(newNode, null);
        } else {
            oParent.insertBefore(newNode, targetNode.nextSibling);
        }
    }
    /**
     * wrap是否包含inner
     * @param  {object} wrap  父级dom
     * @param  {object} inner 子级dom
     * @return {boolean}      包含true 不包含false
     */
    function DomContains(wrap, inner) {
        if (typeof wrap.contains == "function") {
            return wrap.contains(inner);
        } else if (typeof wrap.compareDocumentPosition == "function") {
            return !!(wrap.compareDocumentPosition(inner) & 16);
        }
    }
    //截取中英文字符
    function substr(str, len) {
        var char_length = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加0.5
            if (c >= 1 && c <= 126 || 65376 <= c && c <= 65439) {
                char_length += .5;
            } else {
                char_length += 1;
            }
            if (char_length >= len) {
                var sub_len = char_length == len ? i + 1 : i;
                return str.substr(0, sub_len);
                break;
            }
        }
        return str;
    }
    /**
     * 获取字符串中英文长度
     * @param  {string} str 字符串
     * @return {number}     字符串长度
     */
    function strlen(str) {
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加1 
            if (c >= 1 && c <= 126 || 65376 <= c && c <= 65439) {
                len++;
            } else {
                len += 2;
            }
        }
        return Math.ceil(len / 2);
    }
    function loadHtml(src) {
        var script = create("script");
        script.src = src;
        document.body.appendChild(script);
    }
    /**
     * Array对象 Json对象 深层拷贝
     * @param  {Mix} obj Array对象 or Json对象
     * @return {Mix}     新的Array对象 or Json对象
     */
    function deepCopy(obj) {
        var newObj, type = Object.prototype.toString.call(obj).slice(8, -1);
        if (type === "Object") {
            newObj = {};
        } else if (type === "Array") {
            newObj = [];
        } else {
            return obj;
        }
        for (var key in obj) {
            newObj[key] = deepCopy(obj[key]);
        }
        return newObj;
    }
    function ajax(param) {
        param.beforeSend && param.beforeSend();
        xhr = new XMLHttpRequest();
        if (param.type != "post") {
            param.type = "get";
            if (param.data) {
                param.url += "?" + param.data;
            }
        }
        xhr.open(param.type, param.url, true);
        if (param.type == "get") {
            xhr.send();
        } else {
            xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
            xhr.send(param.data);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    param.success && param.success(xhr.responseText);
                } else {
                    param.error && param.error(xhr.status);
                }
            }
        };
    }
    //获取json长度
    function getJsonLen(json) {
        var length = 0;
        for (var item in json) {
            if (json.hasOwnProperty(item)) {
                length++;
            }
        }
        return length;
    }
    function extend(obj1, obj2) {
        for (var prop in obj2) {
            obj1[prop] = obj2[prop];
        }
        return obj1;
    }
    module.exports = {
        getTop: getTop,
        getLeft: getLeft,
        create: create,
        getTarget: getTarget,
        parseDOM: parseDOM,
        insertAfter: insertAfter,
        DomContains: DomContains,
        substr: substr,
        strlen: strlen,
        loadHtml: loadHtml,
        deepCopy: deepCopy,
        ajax: ajax,
        getJsonLen: getJsonLen,
        extend: extend
    };
});

define("design/js/tools/observer", [], function() {
    var Observer = {
        on: function(type, fn) {
            this.listeners = this.listeners || {};
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push(fn);
        },
        one: function(type, fn) {
            this.on(type, function tmp(ev) {
                fn.call(this, ev);
                this.unbind(type, tmp);
            });
        },
        trigger: function(type, ev) {
            if (this.listeners && this.listeners[type]) {
                for (var i = 0; i < this.listeners[type].length; i++) {
                    this.listeners[type][i].call(this, ev);
                }
            }
        },
        unbind: function(type, fn) {
            if (this.listeners && this.listeners[type]) {
                if (typeof fn !== "function") {
                    delete this.listeners[type];
                } else {
                    for (var i = 0; i < this.listeners[type].length; i++) {
                        if (this.listeners[type][i] === fn) {
                            this.listeners[type].splice(i--, 1);
                        }
                    }
                    if (!this.listeners[type].length) {
                        delete this.listeners[type];
                    }
                }
            }
        }
    };
    return function() {
        this.sub = this.on = Observer.on;
        this.pub = this.trigger = Observer.trigger;
        this.one = Observer.one;
        this.unsub = this.unbind = Observer.unbind;
    };
});

define("design/js/tools/qrcode", [], function(require, exports, module) {
    /**
	 * @fileoverview
	 * - Using the 'QRCode for Javascript library'
	 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
	 * - this library has no dependencies.
	 * 
	 * @author davidshimjs
	 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
	 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
		 */
    var QRCode;
    (function() {
        //---------------------------------------------------------------------
        // QRCode for JavaScript
        //
        // Copyright (c) 2009 Kazuhiko Arase
        //
        // URL: http://www.d-project.com/
        //
        // Licensed under the MIT license:
        //   http://www.opensource.org/licenses/mit-license.php
        //
        // The word "QR Code" is registered trademark of 
        // DENSO WAVE INCORPORATED
        //   http://www.denso-wave.com/qrcode/faqpatent-e.html
        //
        //---------------------------------------------------------------------
        function QR8bitByte(data) {
            this.mode = QRMode.MODE_8BIT_BYTE;
            this.data = data;
            this.parsedData = [];
            // Added to support UTF-8 Characters
            for (var i = 0, l = this.data.length; i < l; i++) {
                var byteArray = [];
                var code = this.data.charCodeAt(i);
                if (code > 65536) {
                    byteArray[0] = 240 | (code & 1835008) >>> 18;
                    byteArray[1] = 128 | (code & 258048) >>> 12;
                    byteArray[2] = 128 | (code & 4032) >>> 6;
                    byteArray[3] = 128 | code & 63;
                } else if (code > 2048) {
                    byteArray[0] = 224 | (code & 61440) >>> 12;
                    byteArray[1] = 128 | (code & 4032) >>> 6;
                    byteArray[2] = 128 | code & 63;
                } else if (code > 128) {
                    byteArray[0] = 192 | (code & 1984) >>> 6;
                    byteArray[1] = 128 | code & 63;
                } else {
                    byteArray[0] = code;
                }
                this.parsedData.push(byteArray);
            }
            this.parsedData = Array.prototype.concat.apply([], this.parsedData);
            if (this.parsedData.length != this.data.length) {
                this.parsedData.unshift(191);
                this.parsedData.unshift(187);
                this.parsedData.unshift(239);
            }
        }
        QR8bitByte.prototype = {
            getLength: function(buffer) {
                return this.parsedData.length;
            },
            write: function(buffer) {
                for (var i = 0, l = this.parsedData.length; i < l; i++) {
                    buffer.put(this.parsedData[i], 8);
                }
            }
        };
        function QRCodeModel(typeNumber, errorCorrectLevel) {
            this.typeNumber = typeNumber;
            this.errorCorrectLevel = errorCorrectLevel;
            this.modules = null;
            this.moduleCount = 0;
            this.dataCache = null;
            this.dataList = [];
        }
        function QRPolynomial(num, shift) {
            if (num.length == undefined) throw new Error(num.length + "/" + shift);
            var offset = 0;
            while (offset < num.length && num[offset] == 0) offset++;
            this.num = new Array(num.length - offset + shift);
            for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
        }
        function QRRSBlock(totalCount, dataCount) {
            this.totalCount = totalCount, this.dataCount = dataCount;
        }
        function QRBitBuffer() {
            this.buffer = [], this.length = 0;
        }
        QRCodeModel.prototype = {
            addData: function(data) {
                var newData = new QR8bitByte(data);
                this.dataList.push(newData), this.dataCache = null;
            },
            isDark: function(row, col) {
                if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) throw new Error(row + "," + col);
                return this.modules[row][col];
            },
            getModuleCount: function() {
                return this.moduleCount;
            },
            make: function() {
                this.makeImpl(!1, this.getBestMaskPattern());
            },
            makeImpl: function(test, maskPattern) {
                this.moduleCount = this.typeNumber * 4 + 17, this.modules = new Array(this.moduleCount);
                for (var row = 0; row < this.moduleCount; row++) {
                    this.modules[row] = new Array(this.moduleCount);
                    for (var col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
                }
                this.setupPositionProbePattern(0, 0), this.setupPositionProbePattern(this.moduleCount - 7, 0), 
                this.setupPositionProbePattern(0, this.moduleCount - 7), this.setupPositionAdjustPattern(), 
                this.setupTimingPattern(), this.setupTypeInfo(test, maskPattern), this.typeNumber >= 7 && this.setupTypeNumber(test), 
                this.dataCache == null && (this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList)), 
                this.mapData(this.dataCache, maskPattern);
            },
            setupPositionProbePattern: function(row, col) {
                for (var r = -1; r <= 7; r++) {
                    if (row + r <= -1 || this.moduleCount <= row + r) continue;
                    for (var c = -1; c <= 7; c++) {
                        if (col + c <= -1 || this.moduleCount <= col + c) continue;
                        0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4 ? this.modules[row + r][col + c] = !0 : this.modules[row + r][col + c] = !1;
                    }
                }
            },
            getBestMaskPattern: function() {
                var minLostPoint = 0, pattern = 0;
                for (var i = 0; i < 8; i++) {
                    this.makeImpl(!0, i);
                    var lostPoint = QRUtil.getLostPoint(this);
                    if (i == 0 || minLostPoint > lostPoint) minLostPoint = lostPoint, pattern = i;
                }
                return pattern;
            },
            createMovieClip: function(target_mc, instance_name, depth) {
                var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth), cs = 1;
                this.make();
                for (var row = 0; row < this.modules.length; row++) {
                    var y = row * cs;
                    for (var col = 0; col < this.modules[row].length; col++) {
                        var x = col * cs, dark = this.modules[row][col];
                        dark && (qr_mc.beginFill(0, 100), qr_mc.moveTo(x, y), qr_mc.lineTo(x + cs, y), qr_mc.lineTo(x + cs, y + cs), 
                        qr_mc.lineTo(x, y + cs), qr_mc.endFill());
                    }
                }
                return qr_mc;
            },
            setupTimingPattern: function() {
                for (var r = 8; r < this.moduleCount - 8; r++) {
                    if (this.modules[r][6] != null) continue;
                    this.modules[r][6] = r % 2 == 0;
                }
                for (var c = 8; c < this.moduleCount - 8; c++) {
                    if (this.modules[6][c] != null) continue;
                    this.modules[6][c] = c % 2 == 0;
                }
            },
            setupPositionAdjustPattern: function() {
                var pos = QRUtil.getPatternPosition(this.typeNumber);
                for (var i = 0; i < pos.length; i++) for (var j = 0; j < pos.length; j++) {
                    var row = pos[i], col = pos[j];
                    if (this.modules[row][col] != null) continue;
                    for (var r = -2; r <= 2; r++) for (var c = -2; c <= 2; c++) r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0 ? this.modules[row + r][col + c] = !0 : this.modules[row + r][col + c] = !1;
                }
            },
            setupTypeNumber: function(test) {
                var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
                for (var i = 0; i < 18; i++) {
                    var mod = !test && (bits >> i & 1) == 1;
                    this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
                }
                for (var i = 0; i < 18; i++) {
                    var mod = !test && (bits >> i & 1) == 1;
                    this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
                }
            },
            setupTypeInfo: function(test, maskPattern) {
                var data = this.errorCorrectLevel << 3 | maskPattern, bits = QRUtil.getBCHTypeInfo(data);
                for (var i = 0; i < 15; i++) {
                    var mod = !test && (bits >> i & 1) == 1;
                    i < 6 ? this.modules[i][8] = mod : i < 8 ? this.modules[i + 1][8] = mod : this.modules[this.moduleCount - 15 + i][8] = mod;
                }
                for (var i = 0; i < 15; i++) {
                    var mod = !test && (bits >> i & 1) == 1;
                    i < 8 ? this.modules[8][this.moduleCount - i - 1] = mod : i < 9 ? this.modules[8][15 - i - 1 + 1] = mod : this.modules[8][15 - i - 1] = mod;
                }
                this.modules[this.moduleCount - 8][8] = !test;
            },
            mapData: function(data, maskPattern) {
                var inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
                for (var col = this.moduleCount - 1; col > 0; col -= 2) {
                    col == 6 && col--;
                    for (;;) {
                        for (var c = 0; c < 2; c++) if (this.modules[row][col - c] == null) {
                            var dark = !1;
                            byteIndex < data.length && (dark = (data[byteIndex] >>> bitIndex & 1) == 1);
                            var mask = QRUtil.getMask(maskPattern, row, col - c);
                            mask && (dark = !dark), this.modules[row][col - c] = dark, bitIndex--, bitIndex == -1 && (byteIndex++, 
                            bitIndex = 7);
                        }
                        row += inc;
                        if (row < 0 || this.moduleCount <= row) {
                            row -= inc, inc = -inc;
                            break;
                        }
                    }
                }
            }
        }, QRCodeModel.PAD0 = 236, QRCodeModel.PAD1 = 17, QRCodeModel.createData = function(typeNumber, errorCorrectLevel, dataList) {
            var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel), buffer = new QRBitBuffer();
            for (var i = 0; i < dataList.length; i++) {
                var data = dataList[i];
                buffer.put(data.mode, 4), buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber)), 
                data.write(buffer);
            }
            var totalDataCount = 0;
            for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
            if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
            buffer.getLengthInBits() + 4 <= totalDataCount * 8 && buffer.put(0, 4);
            while (buffer.getLengthInBits() % 8 != 0) buffer.putBit(!1);
            for (;;) {
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(QRCodeModel.PAD0, 8);
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(QRCodeModel.PAD1, 8);
            }
            return QRCodeModel.createBytes(buffer, rsBlocks);
        }, QRCodeModel.createBytes = function(buffer, rsBlocks) {
            var offset = 0, maxDcCount = 0, maxEcCount = 0, dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
            for (var r = 0; r < rsBlocks.length; r++) {
                var dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
                maxDcCount = Math.max(maxDcCount, dcCount), maxEcCount = Math.max(maxEcCount, ecCount), 
                dcdata[r] = new Array(dcCount);
                for (var i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 255 & buffer.buffer[i + offset];
                offset += dcCount;
                var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount), rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1), modPoly = rawPoly.mod(rsPoly);
                ecdata[r] = new Array(rsPoly.getLength() - 1);
                for (var i = 0; i < ecdata[r].length; i++) {
                    var modIndex = i + modPoly.getLength() - ecdata[r].length;
                    ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
                }
            }
            var totalCodeCount = 0;
            for (var i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
            var data = new Array(totalCodeCount), index = 0;
            for (var i = 0; i < maxDcCount; i++) for (var r = 0; r < rsBlocks.length; r++) i < dcdata[r].length && (data[index++] = dcdata[r][i]);
            for (var i = 0; i < maxEcCount; i++) for (var r = 0; r < rsBlocks.length; r++) i < ecdata[r].length && (data[index++] = ecdata[r][i]);
            return data;
        };
        var QRMode = {
            MODE_NUMBER: 1,
            MODE_ALPHA_NUM: 2,
            MODE_8BIT_BYTE: 4,
            MODE_KANJI: 8
        }, QRErrorCorrectLevel = {
            L: 1,
            M: 0,
            Q: 3,
            H: 2
        }, QRMaskPattern = {
            PATTERN000: 0,
            PATTERN001: 1,
            PATTERN010: 2,
            PATTERN011: 3,
            PATTERN100: 4,
            PATTERN101: 5,
            PATTERN110: 6,
            PATTERN111: 7
        }, QRUtil = {
            PATTERN_POSITION_TABLE: [ [], [ 6, 18 ], [ 6, 22 ], [ 6, 26 ], [ 6, 30 ], [ 6, 34 ], [ 6, 22, 38 ], [ 6, 24, 42 ], [ 6, 26, 46 ], [ 6, 28, 50 ], [ 6, 30, 54 ], [ 6, 32, 58 ], [ 6, 34, 62 ], [ 6, 26, 46, 66 ], [ 6, 26, 48, 70 ], [ 6, 26, 50, 74 ], [ 6, 30, 54, 78 ], [ 6, 30, 56, 82 ], [ 6, 30, 58, 86 ], [ 6, 34, 62, 90 ], [ 6, 28, 50, 72, 94 ], [ 6, 26, 50, 74, 98 ], [ 6, 30, 54, 78, 102 ], [ 6, 28, 54, 80, 106 ], [ 6, 32, 58, 84, 110 ], [ 6, 30, 58, 86, 114 ], [ 6, 34, 62, 90, 118 ], [ 6, 26, 50, 74, 98, 122 ], [ 6, 30, 54, 78, 102, 126 ], [ 6, 26, 52, 78, 104, 130 ], [ 6, 30, 56, 82, 108, 134 ], [ 6, 34, 60, 86, 112, 138 ], [ 6, 30, 58, 86, 114, 142 ], [ 6, 34, 62, 90, 118, 146 ], [ 6, 30, 54, 78, 102, 126, 150 ], [ 6, 24, 50, 76, 102, 128, 154 ], [ 6, 28, 54, 80, 106, 132, 158 ], [ 6, 32, 58, 84, 110, 136, 162 ], [ 6, 26, 54, 82, 110, 138, 166 ], [ 6, 30, 58, 86, 114, 142, 170 ] ],
            G15: 1335,
            G18: 7973,
            G15_MASK: 21522,
            getBCHTypeInfo: function(data) {
                var d = data << 10;
                while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
                return (data << 10 | d) ^ QRUtil.G15_MASK;
            },
            getBCHTypeNumber: function(data) {
                var d = data << 12;
                while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
                return data << 12 | d;
            },
            getBCHDigit: function(data) {
                var digit = 0;
                while (data != 0) digit++, data >>>= 1;
                return digit;
            },
            getPatternPosition: function(typeNumber) {
                return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
            },
            getMask: function(maskPattern, i, j) {
                switch (maskPattern) {
                  case QRMaskPattern.PATTERN000:
                    return (i + j) % 2 == 0;

                  case QRMaskPattern.PATTERN001:
                    return i % 2 == 0;

                  case QRMaskPattern.PATTERN010:
                    return j % 3 == 0;

                  case QRMaskPattern.PATTERN011:
                    return (i + j) % 3 == 0;

                  case QRMaskPattern.PATTERN100:
                    return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;

                  case QRMaskPattern.PATTERN101:
                    return i * j % 2 + i * j % 3 == 0;

                  case QRMaskPattern.PATTERN110:
                    return (i * j % 2 + i * j % 3) % 2 == 0;

                  case QRMaskPattern.PATTERN111:
                    return (i * j % 3 + (i + j) % 2) % 2 == 0;

                  default:
                    throw new Error("bad maskPattern:" + maskPattern);
                }
            },
            getErrorCorrectPolynomial: function(errorCorrectLength) {
                var a = new QRPolynomial([ 1 ], 0);
                for (var i = 0; i < errorCorrectLength; i++) a = a.multiply(new QRPolynomial([ 1, QRMath.gexp(i) ], 0));
                return a;
            },
            getLengthInBits: function(mode, type) {
                if (1 <= type && type < 10) switch (mode) {
                  case QRMode.MODE_NUMBER:
                    return 10;

                  case QRMode.MODE_ALPHA_NUM:
                    return 9;

                  case QRMode.MODE_8BIT_BYTE:
                    return 8;

                  case QRMode.MODE_KANJI:
                    return 8;

                  default:
                    throw new Error("mode:" + mode);
                } else if (type < 27) switch (mode) {
                  case QRMode.MODE_NUMBER:
                    return 12;

                  case QRMode.MODE_ALPHA_NUM:
                    return 11;

                  case QRMode.MODE_8BIT_BYTE:
                    return 16;

                  case QRMode.MODE_KANJI:
                    return 10;

                  default:
                    throw new Error("mode:" + mode);
                } else {
                    if (!(type < 41)) throw new Error("type:" + type);
                    switch (mode) {
                      case QRMode.MODE_NUMBER:
                        return 14;

                      case QRMode.MODE_ALPHA_NUM:
                        return 13;

                      case QRMode.MODE_8BIT_BYTE:
                        return 16;

                      case QRMode.MODE_KANJI:
                        return 12;

                      default:
                        throw new Error("mode:" + mode);
                    }
                }
            },
            getLostPoint: function(qrCode) {
                var moduleCount = qrCode.getModuleCount(), lostPoint = 0;
                for (var row = 0; row < moduleCount; row++) for (var col = 0; col < moduleCount; col++) {
                    var sameCount = 0, dark = qrCode.isDark(row, col);
                    for (var r = -1; r <= 1; r++) {
                        if (row + r < 0 || moduleCount <= row + r) continue;
                        for (var c = -1; c <= 1; c++) {
                            if (col + c < 0 || moduleCount <= col + c) continue;
                            if (r == 0 && c == 0) continue;
                            dark == qrCode.isDark(row + r, col + c) && sameCount++;
                        }
                    }
                    sameCount > 5 && (lostPoint += 3 + sameCount - 5);
                }
                for (var row = 0; row < moduleCount - 1; row++) for (var col = 0; col < moduleCount - 1; col++) {
                    var count = 0;
                    qrCode.isDark(row, col) && count++, qrCode.isDark(row + 1, col) && count++, qrCode.isDark(row, col + 1) && count++, 
                    qrCode.isDark(row + 1, col + 1) && count++;
                    if (count == 0 || count == 4) lostPoint += 3;
                }
                for (var row = 0; row < moduleCount; row++) for (var col = 0; col < moduleCount - 6; col++) qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6) && (lostPoint += 40);
                for (var col = 0; col < moduleCount; col++) for (var row = 0; row < moduleCount - 6; row++) qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col) && (lostPoint += 40);
                var darkCount = 0;
                for (var col = 0; col < moduleCount; col++) for (var row = 0; row < moduleCount; row++) qrCode.isDark(row, col) && darkCount++;
                var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
                return lostPoint += ratio * 10, lostPoint;
            }
        }, QRMath = {
            glog: function(n) {
                if (n < 1) throw new Error("glog(" + n + ")");
                return QRMath.LOG_TABLE[n];
            },
            gexp: function(n) {
                while (n < 0) n += 255;
                while (n >= 256) n -= 255;
                return QRMath.EXP_TABLE[n];
            },
            EXP_TABLE: new Array(256),
            LOG_TABLE: new Array(256)
        };
        for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
        for (var i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
        for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
        QRPolynomial.prototype = {
            get: function(index) {
                return this.num[index];
            },
            getLength: function() {
                return this.num.length;
            },
            multiply: function(e) {
                var num = new Array(this.getLength() + e.getLength() - 1);
                for (var i = 0; i < this.getLength(); i++) for (var j = 0; j < e.getLength(); j++) num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
                return new QRPolynomial(num, 0);
            },
            mod: function(e) {
                if (this.getLength() - e.getLength() < 0) return this;
                var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0)), num = new Array(this.getLength());
                for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
                for (var i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
                return new QRPolynomial(num, 0).mod(e);
            }
        }, QRRSBlock.RS_BLOCK_TABLE = [ [ 1, 26, 19 ], [ 1, 26, 16 ], [ 1, 26, 13 ], [ 1, 26, 9 ], [ 1, 44, 34 ], [ 1, 44, 28 ], [ 1, 44, 22 ], [ 1, 44, 16 ], [ 1, 70, 55 ], [ 1, 70, 44 ], [ 2, 35, 17 ], [ 2, 35, 13 ], [ 1, 100, 80 ], [ 2, 50, 32 ], [ 2, 50, 24 ], [ 4, 25, 9 ], [ 1, 134, 108 ], [ 2, 67, 43 ], [ 2, 33, 15, 2, 34, 16 ], [ 2, 33, 11, 2, 34, 12 ], [ 2, 86, 68 ], [ 4, 43, 27 ], [ 4, 43, 19 ], [ 4, 43, 15 ], [ 2, 98, 78 ], [ 4, 49, 31 ], [ 2, 32, 14, 4, 33, 15 ], [ 4, 39, 13, 1, 40, 14 ], [ 2, 121, 97 ], [ 2, 60, 38, 2, 61, 39 ], [ 4, 40, 18, 2, 41, 19 ], [ 4, 40, 14, 2, 41, 15 ], [ 2, 146, 116 ], [ 3, 58, 36, 2, 59, 37 ], [ 4, 36, 16, 4, 37, 17 ], [ 4, 36, 12, 4, 37, 13 ], [ 2, 86, 68, 2, 87, 69 ], [ 4, 69, 43, 1, 70, 44 ], [ 6, 43, 19, 2, 44, 20 ], [ 6, 43, 15, 2, 44, 16 ], [ 4, 101, 81 ], [ 1, 80, 50, 4, 81, 51 ], [ 4, 50, 22, 4, 51, 23 ], [ 3, 36, 12, 8, 37, 13 ], [ 2, 116, 92, 2, 117, 93 ], [ 6, 58, 36, 2, 59, 37 ], [ 4, 46, 20, 6, 47, 21 ], [ 7, 42, 14, 4, 43, 15 ], [ 4, 133, 107 ], [ 8, 59, 37, 1, 60, 38 ], [ 8, 44, 20, 4, 45, 21 ], [ 12, 33, 11, 4, 34, 12 ], [ 3, 145, 115, 1, 146, 116 ], [ 4, 64, 40, 5, 65, 41 ], [ 11, 36, 16, 5, 37, 17 ], [ 11, 36, 12, 5, 37, 13 ], [ 5, 109, 87, 1, 110, 88 ], [ 5, 65, 41, 5, 66, 42 ], [ 5, 54, 24, 7, 55, 25 ], [ 11, 36, 12 ], [ 5, 122, 98, 1, 123, 99 ], [ 7, 73, 45, 3, 74, 46 ], [ 15, 43, 19, 2, 44, 20 ], [ 3, 45, 15, 13, 46, 16 ], [ 1, 135, 107, 5, 136, 108 ], [ 10, 74, 46, 1, 75, 47 ], [ 1, 50, 22, 15, 51, 23 ], [ 2, 42, 14, 17, 43, 15 ], [ 5, 150, 120, 1, 151, 121 ], [ 9, 69, 43, 4, 70, 44 ], [ 17, 50, 22, 1, 51, 23 ], [ 2, 42, 14, 19, 43, 15 ], [ 3, 141, 113, 4, 142, 114 ], [ 3, 70, 44, 11, 71, 45 ], [ 17, 47, 21, 4, 48, 22 ], [ 9, 39, 13, 16, 40, 14 ], [ 3, 135, 107, 5, 136, 108 ], [ 3, 67, 41, 13, 68, 42 ], [ 15, 54, 24, 5, 55, 25 ], [ 15, 43, 15, 10, 44, 16 ], [ 4, 144, 116, 4, 145, 117 ], [ 17, 68, 42 ], [ 17, 50, 22, 6, 51, 23 ], [ 19, 46, 16, 6, 47, 17 ], [ 2, 139, 111, 7, 140, 112 ], [ 17, 74, 46 ], [ 7, 54, 24, 16, 55, 25 ], [ 34, 37, 13 ], [ 4, 151, 121, 5, 152, 122 ], [ 4, 75, 47, 14, 76, 48 ], [ 11, 54, 24, 14, 55, 25 ], [ 16, 45, 15, 14, 46, 16 ], [ 6, 147, 117, 4, 148, 118 ], [ 6, 73, 45, 14, 74, 46 ], [ 11, 54, 24, 16, 55, 25 ], [ 30, 46, 16, 2, 47, 17 ], [ 8, 132, 106, 4, 133, 107 ], [ 8, 75, 47, 13, 76, 48 ], [ 7, 54, 24, 22, 55, 25 ], [ 22, 45, 15, 13, 46, 16 ], [ 10, 142, 114, 2, 143, 115 ], [ 19, 74, 46, 4, 75, 47 ], [ 28, 50, 22, 6, 51, 23 ], [ 33, 46, 16, 4, 47, 17 ], [ 8, 152, 122, 4, 153, 123 ], [ 22, 73, 45, 3, 74, 46 ], [ 8, 53, 23, 26, 54, 24 ], [ 12, 45, 15, 28, 46, 16 ], [ 3, 147, 117, 10, 148, 118 ], [ 3, 73, 45, 23, 74, 46 ], [ 4, 54, 24, 31, 55, 25 ], [ 11, 45, 15, 31, 46, 16 ], [ 7, 146, 116, 7, 147, 117 ], [ 21, 73, 45, 7, 74, 46 ], [ 1, 53, 23, 37, 54, 24 ], [ 19, 45, 15, 26, 46, 16 ], [ 5, 145, 115, 10, 146, 116 ], [ 19, 75, 47, 10, 76, 48 ], [ 15, 54, 24, 25, 55, 25 ], [ 23, 45, 15, 25, 46, 16 ], [ 13, 145, 115, 3, 146, 116 ], [ 2, 74, 46, 29, 75, 47 ], [ 42, 54, 24, 1, 55, 25 ], [ 23, 45, 15, 28, 46, 16 ], [ 17, 145, 115 ], [ 10, 74, 46, 23, 75, 47 ], [ 10, 54, 24, 35, 55, 25 ], [ 19, 45, 15, 35, 46, 16 ], [ 17, 145, 115, 1, 146, 116 ], [ 14, 74, 46, 21, 75, 47 ], [ 29, 54, 24, 19, 55, 25 ], [ 11, 45, 15, 46, 46, 16 ], [ 13, 145, 115, 6, 146, 116 ], [ 14, 74, 46, 23, 75, 47 ], [ 44, 54, 24, 7, 55, 25 ], [ 59, 46, 16, 1, 47, 17 ], [ 12, 151, 121, 7, 152, 122 ], [ 12, 75, 47, 26, 76, 48 ], [ 39, 54, 24, 14, 55, 25 ], [ 22, 45, 15, 41, 46, 16 ], [ 6, 151, 121, 14, 152, 122 ], [ 6, 75, 47, 34, 76, 48 ], [ 46, 54, 24, 10, 55, 25 ], [ 2, 45, 15, 64, 46, 16 ], [ 17, 152, 122, 4, 153, 123 ], [ 29, 74, 46, 14, 75, 47 ], [ 49, 54, 24, 10, 55, 25 ], [ 24, 45, 15, 46, 46, 16 ], [ 4, 152, 122, 18, 153, 123 ], [ 13, 74, 46, 32, 75, 47 ], [ 48, 54, 24, 14, 55, 25 ], [ 42, 45, 15, 32, 46, 16 ], [ 20, 147, 117, 4, 148, 118 ], [ 40, 75, 47, 7, 76, 48 ], [ 43, 54, 24, 22, 55, 25 ], [ 10, 45, 15, 67, 46, 16 ], [ 19, 148, 118, 6, 149, 119 ], [ 18, 75, 47, 31, 76, 48 ], [ 34, 54, 24, 34, 55, 25 ], [ 20, 45, 15, 61, 46, 16 ] ], 
        QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
            var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
            if (rsBlock == undefined) throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
            var length = rsBlock.length / 3, list = [];
            for (var i = 0; i < length; i++) {
                var count = rsBlock[i * 3 + 0], totalCount = rsBlock[i * 3 + 1], dataCount = rsBlock[i * 3 + 2];
                for (var j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
            }
            return list;
        }, QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
            switch (errorCorrectLevel) {
              case QRErrorCorrectLevel.L:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];

              case QRErrorCorrectLevel.M:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];

              case QRErrorCorrectLevel.Q:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];

              case QRErrorCorrectLevel.H:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];

              default:
                return undefined;
            }
        }, QRBitBuffer.prototype = {
            get: function(index) {
                var bufIndex = Math.floor(index / 8);
                return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
            },
            put: function(num, length) {
                for (var i = 0; i < length; i++) this.putBit((num >>> length - i - 1 & 1) == 1);
            },
            getLengthInBits: function() {
                return this.length;
            },
            putBit: function(bit) {
                var bufIndex = Math.floor(this.length / 8);
                this.buffer.length <= bufIndex && this.buffer.push(0), bit && (this.buffer[bufIndex] |= 128 >>> this.length % 8), 
                this.length++;
            }
        };
        var QRCodeLimitLength = [ [ 17, 14, 11, 7 ], [ 32, 26, 20, 14 ], [ 53, 42, 32, 24 ], [ 78, 62, 46, 34 ], [ 106, 84, 60, 44 ], [ 134, 106, 74, 58 ], [ 154, 122, 86, 64 ], [ 192, 152, 108, 84 ], [ 230, 180, 130, 98 ], [ 271, 213, 151, 119 ], [ 321, 251, 177, 137 ], [ 367, 287, 203, 155 ], [ 425, 331, 241, 177 ], [ 458, 362, 258, 194 ], [ 520, 412, 292, 220 ], [ 586, 450, 322, 250 ], [ 644, 504, 364, 280 ], [ 718, 560, 394, 310 ], [ 792, 624, 442, 338 ], [ 858, 666, 482, 382 ], [ 929, 711, 509, 403 ], [ 1003, 779, 565, 439 ], [ 1091, 857, 611, 461 ], [ 1171, 911, 661, 511 ], [ 1273, 997, 715, 535 ], [ 1367, 1059, 751, 593 ], [ 1465, 1125, 805, 625 ], [ 1528, 1190, 868, 658 ], [ 1628, 1264, 908, 698 ], [ 1732, 1370, 982, 742 ], [ 1840, 1452, 1030, 790 ], [ 1952, 1538, 1112, 842 ], [ 2068, 1628, 1168, 898 ], [ 2188, 1722, 1228, 958 ], [ 2303, 1809, 1283, 983 ], [ 2431, 1911, 1351, 1051 ], [ 2563, 1989, 1423, 1093 ], [ 2699, 2099, 1499, 1139 ], [ 2809, 2213, 1579, 1219 ], [ 2953, 2331, 1663, 1273 ] ];
        function _isSupportCanvas() {
            return typeof CanvasRenderingContext2D != "undefined";
        }
        // android 2.x doesn't support Data-URI spec
        function _getAndroid() {
            var android = false;
            var sAgent = navigator.userAgent;
            if (/android/i.test(sAgent)) {
                // android
                android = true;
                aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);
                if (aMat && aMat[1]) {
                    android = parseFloat(aMat[1]);
                }
            }
            return android;
        }
        var svgDrawer = function() {
            var Drawing = function(el, htOption) {
                this._el = el;
                this._htOption = htOption;
            };
            Drawing.prototype.draw = function(oQRCode) {
                var _htOption = this._htOption;
                var _el = this._el;
                var nCount = oQRCode.getModuleCount();
                var nWidth = Math.floor(_htOption.width / nCount);
                var nHeight = Math.floor(_htOption.height / nCount);
                this.clear();
                function makeSVG(tag, attrs) {
                    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
                    for (var k in attrs) if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
                    return el;
                }
                var svg = makeSVG("svg", {
                    viewBox: "0 0 " + String(nCount) + " " + String(nCount),
                    width: "100%",
                    height: "100%",
                    fill: _htOption.colorLight
                });
                svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
                _el.appendChild(svg);
                svg.appendChild(makeSVG("rect", {
                    fill: _htOption.colorDark,
                    width: "1",
                    height: "1",
                    id: "template"
                }));
                for (var row = 0; row < nCount; row++) {
                    for (var col = 0; col < nCount; col++) {
                        if (oQRCode.isDark(row, col)) {
                            var child = makeSVG("use", {
                                x: String(row),
                                y: String(col)
                            });
                            child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template");
                            svg.appendChild(child);
                        }
                    }
                }
            };
            Drawing.prototype.clear = function() {
                while (this._el.hasChildNodes()) this._el.removeChild(this._el.lastChild);
            };
            return Drawing;
        }();
        var useSVG = document.documentElement.tagName.toLowerCase() === "svg";
        // Drawing in DOM by using Table tag
        var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? function() {
            var Drawing = function(el, htOption) {
                this._el = el;
                this._htOption = htOption;
            };
            /**
			 * Draw the QRCode
			 * 
			 * @param {QRCode} oQRCode
			 */
            Drawing.prototype.draw = function(oQRCode) {
                var _htOption = this._htOption;
                var _el = this._el;
                var nCount = oQRCode.getModuleCount();
                var nWidth = Math.floor(_htOption.width / nCount);
                var nHeight = Math.floor(_htOption.height / nCount);
                var aHTML = [ '<table style="border:0;border-collapse:collapse;">' ];
                for (var row = 0; row < nCount; row++) {
                    aHTML.push("<tr>");
                    for (var col = 0; col < nCount; col++) {
                        aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + "px;height:" + nHeight + "px;background-color:" + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
                    }
                    aHTML.push("</tr>");
                }
                aHTML.push("</table>");
                _el.innerHTML = aHTML.join("");
                // Fix the margin values as real size.
                var elTable = _el.childNodes[0];
                var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
                var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
                if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
                    elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";
                }
            };
            /**
			 * Clear the QRCode
			 */
            Drawing.prototype.clear = function() {
                this._el.innerHTML = "";
            };
            return Drawing;
        }() : function() {
            // Drawing in Canvas
            function _onMakeImage() {
                this._elImage.src = this._elCanvas.toDataURL("image/png");
                this._elImage.style.display = "block";
                this._elCanvas.style.display = "none";
            }
            // Android 2.1 bug workaround
            // http://code.google.com/p/android/issues/detail?id=5141
            if (this._android && this._android <= 2.1) {
                var factor = 1 / window.devicePixelRatio;
                var drawImage = CanvasRenderingContext2D.prototype.drawImage;
                CanvasRenderingContext2D.prototype.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
                    if ("nodeName" in image && /img/i.test(image.nodeName)) {
                        for (var i = arguments.length - 1; i >= 1; i--) {
                            arguments[i] = arguments[i] * factor;
                        }
                    } else if (typeof dw == "undefined") {
                        arguments[1] *= factor;
                        arguments[2] *= factor;
                        arguments[3] *= factor;
                        arguments[4] *= factor;
                    }
                    drawImage.apply(this, arguments);
                };
            }
            /**
			 * Check whether the user's browser supports Data URI or not
			 * 
			 * @private
			 * @param {Function} fSuccess Occurs if it supports Data URI
			 * @param {Function} fFail Occurs if it doesn't support Data URI
			 */
            function _safeSetDataURI(fSuccess, fFail) {
                var self = this;
                self._fFail = fFail;
                self._fSuccess = fSuccess;
                // Check it just once
                if (self._bSupportDataURI === null) {
                    var el = document.createElement("img");
                    var fOnError = function() {
                        self._bSupportDataURI = false;
                        if (self._fFail) {
                            _fFail.call(self);
                        }
                    };
                    var fOnSuccess = function() {
                        self._bSupportDataURI = true;
                        if (self._fSuccess) {
                            self._fSuccess.call(self);
                        }
                    };
                    el.onabort = fOnError;
                    el.onerror = fOnError;
                    el.onload = fOnSuccess;
                    el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
                    // the Image contains 1px data.
                    return;
                } else if (self._bSupportDataURI === true && self._fSuccess) {
                    self._fSuccess.call(self);
                } else if (self._bSupportDataURI === false && self._fFail) {
                    self._fFail.call(self);
                }
            }
            /**
			 * Drawing QRCode by using canvas
			 * 
			 * @constructor
			 * @param {HTMLElement} el
			 * @param {Object} htOption QRCode Options 
			 */
            var Drawing = function(el, htOption) {
                this._bIsPainted = false;
                this._android = _getAndroid();
                this._htOption = htOption;
                this._elCanvas = document.createElement("canvas");
                this._elCanvas.width = htOption.width;
                this._elCanvas.height = htOption.height;
                el.appendChild(this._elCanvas);
                this._el = el;
                this._oContext = this._elCanvas.getContext("2d");
                this._bIsPainted = false;
                this._elImage = document.createElement("img");
                this._elImage.alt = "Scan me!";
                this._elImage.style.display = "none";
                this._el.appendChild(this._elImage);
                this._bSupportDataURI = null;
            };
            /**
			 * Draw the QRCode
			 * 
			 * @param {QRCode} oQRCode 
			 */
            Drawing.prototype.draw = function(oQRCode) {
                var _elImage = this._elImage;
                var _oContext = this._oContext;
                var _htOption = this._htOption;
                var nCount = oQRCode.getModuleCount();
                var nWidth = _htOption.width / nCount;
                var nHeight = _htOption.height / nCount;
                var nRoundedWidth = Math.round(nWidth);
                var nRoundedHeight = Math.round(nHeight);
                _elImage.style.display = "none";
                this.clear();
                for (var row = 0; row < nCount; row++) {
                    for (var col = 0; col < nCount; col++) {
                        var bIsDark = oQRCode.isDark(row, col);
                        var nLeft = col * nWidth;
                        var nTop = row * nHeight;
                        _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
                        _oContext.lineWidth = 1;
                        _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
                        _oContext.fillRect(nLeft, nTop, nWidth, nHeight);
                        // 鞎堩嫲 鞎Μ鞏挫嫳 氚╈ 觳橂Μ
                        _oContext.strokeRect(Math.floor(nLeft) + .5, Math.floor(nTop) + .5, nRoundedWidth, nRoundedHeight);
                        _oContext.strokeRect(Math.ceil(nLeft) - .5, Math.ceil(nTop) - .5, nRoundedWidth, nRoundedHeight);
                    }
                }
                this._bIsPainted = true;
            };
            /**
			 * Make the image from Canvas if the browser supports Data URI.
			 */
            Drawing.prototype.makeImage = function() {
                if (this._bIsPainted) {
                    _safeSetDataURI.call(this, _onMakeImage);
                }
            };
            /**
			 * Return whether the QRCode is painted or not
			 * 
			 * @return {Boolean}
			 */
            Drawing.prototype.isPainted = function() {
                return this._bIsPainted;
            };
            /**
			 * Clear the QRCode
			 */
            Drawing.prototype.clear = function() {
                this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
                this._bIsPainted = false;
            };
            /**
			 * @private
			 * @param {Number} nNumber
			 */
            Drawing.prototype.round = function(nNumber) {
                if (!nNumber) {
                    return nNumber;
                }
                return Math.floor(nNumber * 1e3) / 1e3;
            };
            return Drawing;
        }();
        /**
		 * Get the type by string length
		 * 
		 * @private
		 * @param {String} sText
		 * @param {Number} nCorrectLevel
		 * @return {Number} type
		 */
        function _getTypeNumber(sText, nCorrectLevel) {
            var nType = 1;
            var length = _getUTF8Length(sText);
            for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
                var nLimit = 0;
                switch (nCorrectLevel) {
                  case QRErrorCorrectLevel.L:
                    nLimit = QRCodeLimitLength[i][0];
                    break;

                  case QRErrorCorrectLevel.M:
                    nLimit = QRCodeLimitLength[i][1];
                    break;

                  case QRErrorCorrectLevel.Q:
                    nLimit = QRCodeLimitLength[i][2];
                    break;

                  case QRErrorCorrectLevel.H:
                    nLimit = QRCodeLimitLength[i][3];
                    break;
                }
                if (length <= nLimit) {
                    break;
                } else {
                    nType++;
                }
            }
            if (nType > QRCodeLimitLength.length) {
                throw new Error("Too long data");
            }
            return nType;
        }
        function _getUTF8Length(sText) {
            var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, "a");
            return replacedText.length + (replacedText.length != sText ? 3 : 0);
        }
        /**
		 * @class QRCode
		 * @constructor
		 * @example 
		 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
		 *
		 * @example
		 * var oQRCode = new QRCode("test", {
		 *    text : "http://naver.com",
		 *    width : 128,
		 *    height : 128
		 * });
		 * 
		 * oQRCode.clear(); // Clear the QRCode.
		 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
		 *
		 * @param {HTMLElement|String} el target element or 'id' attribute of element.
		 * @param {Object|String} vOption
		 * @param {String} vOption.text QRCode link data
		 * @param {Number} [vOption.width=256]
		 * @param {Number} [vOption.height=256]
		 * @param {String} [vOption.colorDark="#000000"]
		 * @param {String} [vOption.colorLight="#ffffff"]
		 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H] 
		 */
        QRCode = function(el, vOption) {
            this._htOption = {
                width: 256,
                height: 256,
                typeNumber: 4,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRErrorCorrectLevel.H
            };
            if (typeof vOption === "string") {
                vOption = {
                    text: vOption
                };
            }
            // Overwrites options
            if (vOption) {
                for (var i in vOption) {
                    this._htOption[i] = vOption[i];
                }
            }
            if (typeof el == "string") {
                el = document.getElementById(el);
            }
            this._android = _getAndroid();
            this._el = el;
            this._oQRCode = null;
            this._oDrawing = new Drawing(this._el, this._htOption);
            if (this._htOption.text) {
                this.makeCode(this._htOption.text);
            }
        };
        /**
		 * Make the QRCode
		 * 
		 * @param {String} sText link data
		 */
        QRCode.prototype.makeCode = function(sText) {
            this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
            this._oQRCode.addData(sText);
            this._oQRCode.make();
            this._el.title = sText;
            this._oDrawing.draw(this._oQRCode);
            this.makeImage();
        };
        /**
		 * Make the Image from Canvas element
		 * - It occurs automatically
		 * - Android below 3 doesn't support Data-URI spec.
		 * 
		 * @private
		 */
        QRCode.prototype.makeImage = function() {
            if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
                this._oDrawing.makeImage();
            }
        };
        /**
		 * Clear the QRCode
		 */
        QRCode.prototype.clear = function() {
            this._oDrawing.clear();
        };
        /**
		 * @name QRCode.CorrectLevel
		 */
        QRCode.CorrectLevel = QRErrorCorrectLevel;
    })();
    exports.QRCode = QRCode;
});

define("design/js/view/dialog", [ "./setting", "../tools/method" ], function(require, exports, module) {
    var Setting = require("./setting");
    var m = require("../tools/method");
    var param, wrapper = document.getElementById("wrapper");
    //bind close
    uClose();
    /**
	 * append dialog DOM
	 * @param  {json} argc   type弹窗类型
	 * @return {object}      会话框dom
	 */
    function dialog(argc) {
        //移出之前的会话框
        closeAll();
        param = argc;
        var dom = mask();
        document.body.appendChild(dom);
        wrapper.classList.add("filter");
        return dom;
    }
    /**
	 * append  message DOM
	 * @param  {json}  argc  status(成功or失败) text(提示文字) 
	 * @return {object}      meesage DOM
	 */
    function message(argc) {
        //移出之前的会话框
        closeAll();
        param = argc;
        //转换DOM
        var message = m.parseDOM(tDialog("dialog-message", tMessage))[0];
        //添加DOM
        document.body.appendChild(message);
        uMessage(message);
        return message;
    }
    /**
	 * 创建遮罩层&会话框模板
	 * @return {object} 遮罩层&会话框DOM
	 */
    function mask() {
        var html, mask = m.create("div");
        mask.classList.add("dialog-mask");
        mask.id = "dialog-mask";
        switch (param.type) {
          case "preview":
            html = tDialog("dialog-preview animation-slideDown", tQrcode);
            break;

          case "save":
            html = tDialog("dialog-box animation-zoomIn", tSave, "保存");
            break;

          case "enabled":
            html = tDialog("dialog-box animation-zoomIn", tSave, "保存并启用");
            break;

          case "loading":
            html = tDialog("dialog-loading", tLoading);
        }
        mask.innerHTML = html;
        return mask;
    }
    function uMessage(obj) {
        setTimeout(function() {
            m.DomContains(document.body, obj) && document.body.removeChild(obj);
        }, param.time || 2e3);
    }
    //bind close
    function uClose() {
        document.addEventListener("click", function(ev) {
            if (ev.target.classList.contains("dialog-close") || ev.target.classList.contains("btn-cancel")) {
                closeAll();
            }
        }, false);
    }
    //remove mask dialog
    function closeAll() {
        var mask = document.getElementById("dialog-mask");
        var dialog = document.getElementById("dialog-box");
        var wrapper = document.getElementById("wrapper");
        var body = document.body;
        m.DomContains(body, mask) && document.body.removeChild(mask);
        m.DomContains(body, dialog) && dialog.parentNode.removeChild(dialog);
        wrapper.classList.remove("filter");
    }
    /**
	 * 会话框html
	 * @param  {string} type  会话框样式
	 * @param  {function} inner 会话框主体内容
	 * @param  {string} title 会话框标题
	 * @return {string}      会话框html
	 */
    function tDialog(type, inner, title) {
        return [ '<div class="' + type + '" id="dialog-box">', '<i class="dialog-close"></i>', title ? '<h2 class="dialog-title">' + title + "</h2>" : "", '<div class="dialog-main">', inner(), "</div>", "</div>" ].join("");
    }
    //预览
    function tQrcode() {
        return [ '<h2 class="dialog-code-title">请用手机扫描二维码浏览</h2>', '<div class="dialog-code"></div>', '<div class="dialog-btn-wrap">', '<button class="btn-save" data-action="save">保存</button>', '<button class="btn-enabled" data-action="enabled">保存并启用</button>', "</div>" ].join("");
    }
    //保存
    function tSave() {
        //获取页面设置模板
        var tSetting = new Setting.Templates({
            data: param.data
        });
        var html = tSetting.getPageName();
        //返回会话框主体内容html
        return [ html, '<div class="dialog-btn-wrap">', '<button class="btn-' + param.type + '" data-action="last-' + param.type + '">' + param.btnText + "</button>", '<button class="btn-cancel">取消</button>', "</div>" ].join("");
    }
    //提示信息
    function tMessage() {
        return [ '<i class="' + (param.status == 1 ? "message-success" : "message-error") + '"></i>', '<span class="message-text">' + param.text + "</span>" ].join("");
    }
    //loading
    function tLoading() {
        return [ '<i class="loading"></i>', '<span class="text">' + param.content + "</span>" ].join("");
    }
    exports.dialog = dialog;
    exports.message = message;
    exports.closeAll = closeAll;
});

define("design/js/view/load-body", [], function(require, exports, module) {
    var widgets = [ {
        type: "text",
        name: "单行输入框"
    }, {
        type: "textarea",
        name: "多行输入框"
    }, {
        type: "number",
        name: "数字输入框"
    }, {
        type: "radio",
        name: "单选框"
    }, {
        type: "date",
        name: "日期"
    }, {
        type: "dateRange",
        name: "日期区间"
    }, {
        type: "image",
        name: "图片"
    }, {
        type: "detail",
        name: "明细"
    } ];
    var tpls = [ {
        path: "default",
        name: "最近一次保存的"
    }, {
        path: ".tpl/empty",
        name: "空模板"
    }, {
        path: ".tpl/conversion",
        name: "转正申请"
    }, {
        path: ".tpl/seal",
        name: "用印盖章"
    }, {
        path: ".tpl/consuming",
        name: "物品领用"
    }, {
        path: ".tpl/dimission",
        name: "离职"
    }, {
        path: ".tpl/evection",
        name: "出差"
    }, {
        path: ".tpl/gotout",
        name: "外出"
    }, {
        path: ".tpl/overtime",
        name: "加班"
    }, {
        path: ".tpl/payment",
        name: "支付"
    }, {
        path: ".tpl/recruit",
        name: "招聘"
    }, {
        path: ".tpl/reimburse",
        name: "报销"
    }, {
        path: ".tpl/leave",
        name: "请假"
    }, {
        path: ".tpl/123456789",
        name: "加载失败"
    } ];
    /**
	 * 控件样本
	 * @param  {Array} widgets 控件集合
	 * @return {string}         控件DOM
	 */
    function tWidget() {
        var html = '<div class="controls" name="tpl-main">';
        widgets.forEach(function(obj) {
            html += '<span class="control-item" name="control" data-type="' + obj.type + '">' + obj.name + '<i class="i-' + obj.type + '"></i></span>';
        });
        html += "</div>";
        return html;
    }
    //占位符
    function tPlaceholder() {
        return '<div name="phone-item" data-role="placeholder"></div>';
    }
    /**
	 * 云模板
	 * @return {String} html
	 */
    function tTpl() {
        var html = '<div class="templates" name="tpl-main" id="tpl-wrap">';
        tpls.forEach(function(obj) {
            html += '<a href="#' + obj.path + '" class="tpl-item" data-name="tpl">' + obj.name + "</a>";
        });
        html += "</div>";
        return html;
    }
    /**
	 * 获取模板名
	 * @return {String} 模板名
	 */
    function getTplName(path) {
        var name;
        tpls.forEach(function(obj) {
            if (obj.path == path) {
                name = obj.name;
                return;
            }
        });
        return name;
    }
    var html = [ '<section id="wrapper">', '<header class="header">', '<h1 class="header-title">审批设计器</h1>', '<div class="header-actions" id="header-actions">', '<button class="btn-preview" id="preview">预览</button>', '<button class="btn-save" data-action="save">保存</button>', '<button class="btn-enabled" data-action="enabled">保存并启用</button>', "</div>", "</header>", '<section class="main">', '<section class="control-wrap" id="controls">', "<div>", '<a href="javascript:void(0)" class="op-title active">控件</a>', '<a href="javascript:void(0)" class="op-title">云模板</a>', "</div>", tWidget(widgets), "</section>", '<section class="phone-wrap">', '<div class="phone-inner" id="phone-inner">', '<div class="phone-body" id="phone-body">', tPlaceholder(), "</div>", '<div class="phone-tpl-prompt"><span></span></div>', "</div>", "</section>", '<aside class="setting-wrap" id="setting-wrap">', '<div class="setting-tab" id="setting-tab">', '<a href="javascript:void(0)" class="op-title">控件设置</a>', '<a href="javascript:void(0)" class="op-title active">审批设置</a>', "</div>", "</aside>", "</section>", "</section>" ].join("");
    document.body.innerHTML += html;
    exports.tPlaceholder = tPlaceholder;
    exports.tWidget = tWidget;
    exports.tTpl = tTpl;
    exports.getTplName = getTplName;
});

define("design/js/view/load-brower", [], function(require, exports, module) {
    var browers = [ {
        name: "Chrome",
        link: "https://www.google.com/chrome/",
        src: "design/images/brower/chrome.png"
    }, {
        name: "Safari",
        link: "https://www.apple.com/cn/safari/",
        src: "design/images/brower/safari.png"
    }, {
        name: "Firefox",
        link: "https://www.mozilla.org/zh-CN/firefox/new/",
        src: "design/images/brower/firefox.png"
    }, {
        name: "Internet Explorer 11",
        link: "http://windows.microsoft.com/zh-cn/internet-explorer/ie-11-worldwide-languages",
        src: "design/images/brower/ie.png"
    } ];
    /**
	 * 创建浏览器标签
	 * @param  {Array} browers 浏览器集合
	 * @return {String}         浏览器DOM
	 */
    function createBrowers(browers) {
        var html = "";
        for (var i = 0; i < browers.length; i++) {
            html += [ '<a href="' + browers[i].link + '">', '<img src="' + browers[i].src + '" alt="下载' + browers[i].name + '浏览器" />', "<span>" + browers[i].name + "</span>", "</a>" ].join("");
        }
        return html;
    }
    var html = [ '<div class="brower-wrapper">', "<h1>", "很抱歉您目前使用的浏览器无法完整支持审批设计器，<br />", "为了保证您的使用效果，请下载并安装以下任一最新版本的浏览器。", "</h1>", '<div class="brower-main">', createBrowers(browers), "</div>", "</div>" ].join("");
    document.body.innerHTML += html;
});

define("design/js/view/phone", [ "../tools/method" ], function(require, exports, module) {
    var m = require("../tools/method");
    var Templates = function(param) {
        this.param = param;
    };
    Templates.prototype = {
        getPhoneItem: function() {
            this.createPhoneItem();
            this.createClose();
            this.switchItem();
            return this.item;
        },
        createPhoneItem: function() {
            this.createTag("item", "div", "phone-item");
            this.item.setAttribute("name", "phone-item");
            this.item.classList.add("phone-item-" + this.param.type);
            this.item.dataset.type = this.param.type;
            this.item.dataset.id = this.param.id;
        },
        createClose: function() {
            this.createTag("overlay", "div", "phone-overlay", this.item);
            this.createTag("close", "div", "phone-close", this.overlay);
        },
        switchItem: function() {
            switch (this.param.type) {
              case "dateRange":
                this.createDateRangeView();
                break;

              case "detail":
                this.createDetailView();
                break;

              default:
                this.createPlainView();
            }
        },
        createPlainView: function() {
            /*普通视图*/
            this.createTag("view", "div", "phone-view", this.item);
            this.createBorder();
            this.label.innerHTML = this.param.title;
            this.prompt.innerHTML = this.param.prompt;
        },
        createDateRangeView: function() {
            /*日期区间*/
            this.createTag("view", "div", "phone-view", this.item);
            this.createBorder();
            this.createTag("borderEnd", "div", "phone-border", this.view);
            this.createTag("labelEnd", "label", "phone-label", this.borderEnd, "title2");
            this.createTag("placeholderEnd", "span", "phone-placeholder", this.borderEnd);
            this.createTag("promptEnd", "span", "", this.placeholderEnd, "prompt");
            this.createTag("requireEnd", "span", "", this.placeholderEnd, "require");
            this.label.innerHTML = this.param.title ? this.param.title : "开始时间";
            this.labelEnd.innerHTML = this.param.title2 ? this.param.title2 : "结束时间";
            this.prompt.innerHTML = this.promptEnd.innerHTML = "请选择";
            this.requireEnd.innerHTML = this.param.require;
        },
        createDetailView: function() {
            /*明细*/
            this.createTag("view", "div", "phone-view", this.item);
            this.createTag("title", "label", "phone-item-title", this.view, "title");
            this.createTag("area", "div", "phone-area", this.view);
            this.createTag("prompt", "div", "phone-area-prompt", this.area);
            this.createTag("name_item", "div", "", this.area);
            this.createTag("addDetail", "div", "phone-addDetail", this.view, "addDetail");
            this.title.innerHTML = this.param.title;
            this.prompt.innerHTML = "可以拖入多个组件（不包含明细组件）";
            this.name_item.setAttribute("name", "phone-item");
            this.name_item.dataset.role = "area";
            this.addDetail.innerHTML = "增加明细";
        },
        createBorder: function() {
            this.createTag("border", "div", "phone-border", this.view);
            this.createTag("label", "label", "phone-label", this.border, "title");
            this.createTag("placeholder", "span", "phone-placeholder", this.border);
            this.createTag("prompt", "span", "", this.placeholder, "prompt");
            this.createTag("require", "span", "", this.placeholder, "require");
            this.require.innerHTML = this.param.require;
        },
        /**
         * 创建标签
         * @param  {string}
         * @param  {string} 标签
         * @param  {string} 元素class名
         * @param  {object}	元素父级
         * @param  {str} 对应数据模型
         */
        createTag: function(obj, label, sClass, parent, model) {
            this[obj] = m.create(label);
            sClass && this[obj].classList.add(sClass);
            parent && parent.appendChild(this[obj]);
            model && this[obj].setAttribute("data-bind-" + this.param.id, model);
        }
    };
    function createWidget(data) {
        /*创建新控件模板*/
        var createItem = new Templates(data);
        /*返回新控件模板*/
        return createItem.getPhoneItem();
    }
    exports.Templates = Templates;
    exports.createWidget = createWidget;
});

define("design/js/view/setting", [ "../tools/method" ], function(require, exports, module) {
    var m = require("../tools/method");
    var Templates = function(param) {
        this.data = param.data;
        this.hideError = param.hideError;
    };
    Templates.prototype = {
        getSetting: function() {
            this.createSetting();
            return this.setting;
        },
        createSetting: function() {
            this.createTag("setting", "div", "setting-cont");
            this.setting.dataset.id = this.data.id;
            switch (this.data.type) {
              case "pageName":
                this.createPageName();
                break;

              case "image":
                this.createIamge();
                break;

              case "detail":
                this.createDetail();
                break;

              case "date":
                this.createDate();
                break;

              case "dateRange":
                this.createDateRange();
                break;

              case "radio":
                this.createRadio();
                break;

              default:
                this.createPlain();
            }
        },
        createPlain: function() {
            //标准设置
            var html = this.tTitleGroup();
            html += this.tTitle("提示文字", this.data.verifyText.prompt, this.data.invalid.prompt) + this.tText("prompt", this.data.prompt, this.data.invalid.prompt);
            html += this.tTitle("验证", "") + this.tRequire();
            this.setting.innerHTML += html;
        },
        createIamge: function() {
            //图片设置
            var html = this.tTitleGroup();
            html += this.tTitle("验证", "") + this.tRequire();
            this.setting.innerHTML += html;
        },
        createDetail: function() {
            //明细设置
            var html = this.tTitleGroup();
            html += this.tTitle("动作名称", "最多10个字") + this.tText("addDetail", this.data.addDetail, this.data.invalid.addDetail);
            this.setting.innerHTML += html;
        },
        createDate: function() {
            //日期设置
            var html = this.tTitleGroup();
            html += this.tTitle("日期类型", "") + this.tDataType();
            html += this.tTitle("验证", "") + this.tRequire();
            this.setting.innerHTML += html;
        },
        createDateRange: function() {
            //日期区间设置
            var html = this.tTitle("标题1", this.data.verifyText.title, this.data.invalid.title) + this.tText("title", this.data.title, this.data.invalid.title);
            html += this.tTitle("标题2", this.data.verifyText.title2, this.data.invalid.title2) + this.tText("title2", this.data.title2, this.data.invalid.title2);
            html += this.tTitle("日期类型", "") + this.tDataType();
            html += this.tTitle("验证", "") + this.tRequire();
            this.setting.innerHTML += html;
        },
        createRadio: function() {
            //单选框设置
            var html = this.tTitleGroup();
            html += this.tTitle("选项", "最多200项，每项最多20个字") + this.tOptionGroup();
            html += this.tTitle("验证", "") + this.tRequire();
            this.setting.innerHTML += html;
        },
        createPageName: function() {
            //页面设置
            this.setting.innerHTML += this.getPageName();
        },
        getPageName: function() {
            var hideError = this.hideError && m.strlen(this.data.title) < 10;
            //隐藏错误样式
            var invalidTitle = this.data.invalid.title;
            var invalidExplain = this.data.invalid.explain;
            var html = this.tTitle("审批名称", this.data.verifyText.title, hideError ? false : invalidTitle);
            html += this.tText("title", this.data.title, hideError ? false : invalidTitle);
            html += this.tTitle("审批说明", this.data.verifyText.explain, invalidExplain);
            html += this.tTextarea("explain", this.data.explain, invalidExplain);
            html += this.tTitle("图标", "") + this.tIcon("curIcon");
            return '<div data-id="' + this.data.id + '">' + html + "</div>";
        },
        tTitleGroup: function() {
            //标题组合模板
            return this.tTitle("标题", this.data.verifyText.title, this.data.invalid.title) + this.tText("title", this.data.title, this.data.invalid.title);
        },
        tOptionGroup: function() {
            //选项组合模板
            var html = "";
            for (var i = 0; i < this.data.options.length; i++) {
                html += this.tOption(this.data.options[i], i);
            }
            return this.tItem(html);
        },
        tTitle: function(title, remark, error) {
            return [ '<div class="setting-title">', '<span class="tit">' + title + "</span>", '<span class="remark ' + (error ? "error" : "") + '">' + remark + "</span>", "</div>" ].join("");
        },
        tText: function(model, value, error) {
            //页面标题隐藏错误样式
            var hideError = this.hideError ? 'data-error="hide"' : "";
            var bind = "data-bind-" + this.data.id + '="' + model + '"';
            return this.tItem('<input type="text" class="setting-text ' + (error ? "error" : "") + '"' + hideError + ' value="' + value + '"' + bind + "/>");
        },
        tRequire: function(value) {
            var bind = "data-bind-" + this.data.id + '="require"';
            return this.tItem('<label class="setting-check"><input type="checkbox" data-true-value="（必填）"  data-false-value="" ' + bind + (this.data.require ? "checked" : "") + " />必填</label>");
        },
        tDataType: function() {
            //日期范围
            var bind = "data-bind-" + this.data.id + '="datetype"';
            return this.tItem([ '<label class="setting-radio"><input type="radio" name="datetype" ' + bind + ' value="datetime" ' + (this.data.datetype == "datetime" ? "checked" : "") + " />年-月-日 时:分</label>", '<label class="setting-radio"><input type="radio" name="datetype" ' + bind + ' value="date" ' + (this.data.datetype == "date" ? "checked" : "") + " />年-月-日</label>" ].join(""));
        },
        tItem: function(content) {
            return '<div class="setting-item">' + content + "</div>";
        },
        tOption: function(value, index) {
            return [ '<div class="setting-option" data-index="' + index + '">', '<input type="text" class="setting-text" data-model="options" value="' + value + '" />', '<a class="option-delete"  data-model="option-delete"></a>', '<a class="option-add"  data-model="option-add"></a>', "</div>" ].join("");
        },
        tTextarea: function(model, value, error) {
            var bind = "data-bind-" + this.data.id + '="' + model + '"';
            return this.tItem("<textarea " + bind + ' class="setting-text ' + (error ? "error" : "") + '">' + value + "</textarea>");
        },
        tIcon: function(model) {
            var arr = [];
            var bind = "data-bind-" + this.data.id + '="' + model + '"';
            for (var i = 0; i < this.data.icons.length; i++) {
                arr.push("<span " + (this.data.curIcon == i + 1 ? "class=active" : "") + '><img src="./design/images/app/' + this.data.icons[i] + '" ' + bind + ' data-value="' + (i + 1) + '" /></span>');
            }
            return '<div class="setting-icon" data-role="curIconWrap">' + arr.join("") + "</div>";
        },
        /**
		 * 创建标签
		 * @param  {string}
		 * @param  {string}
		 * @param  {string}
		 * @param  {object}
		 */
        createTag: function(obj, label, sClass, parent) {
            this[obj] = m.create(label);
            sClass && this[obj].classList.add(sClass);
            parent && parent.appendChild(this[obj]);
        }
    };
    exports.Templates = Templates;
});

define("config/config", [], function(require, exports, module) {
    var prefix = "http://";
    if (window.location.host.indexOf("css.tianyuyun.cn") !== -1) {
        prefix += "116.211.105.45:20013";
    } else {
        prefix += "10.8.10.55:8080";
    }
    var Path = {
        //预览接口
        preview: "php/preview.php",
        //保存模板数据接口
        template: "php/template.php",
        //增加审批模板接口
        save: "server/save.php",
        // save: prefix + '/friendcircle/audit/addtemplate',
        //mobile无刷新上传图片接口
        file: "../server/file.php",
        // file: prefix + '/friendcircle/audit/qfile',
        //mobile提交审批项接口
        submit: "../server/submit.php",
        // submit: prefix + '/friendcircle/audit/additem',
        //获取审批人列表接口
        getApprover: prefix + "/friendcircle/audit/qteacher",
        //设计器模板数据js保存路径
        designDataPath: "php/data/",
        //mobile模板数据js保存路径
        mobileDataPath: "../php/data/"
    };
    // a)http://10.8.10.55:8080/friendcircle/audit/addtemplate
    // -->增加审批模板接口
    // b)http://10.8.10.55:8080/friendcircle/audit/additem
    // -->增加审批项接口
    // c)http://10.8.10.55:8080/friendcircle/audit/qfile
    // -->上传图片接口 img和suffix
    // d)http://10.8.10.55:8080/friendcircle/audit/getauditors
    // -->获取审批人接口
    // e)http://10.8.10.55:8080/friendcircle/audit/addtemplate
    // -->编辑审批模板接口，此时要传入id，也就是说凡是传入id的 我都会认为是编辑的
    module.exports = {
        Path: Path
    };
});
