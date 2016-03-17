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