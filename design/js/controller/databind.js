define(function(require, exports, module) {
    'use strict';
    var Escape = require('../tools/escape'); //转义

    /**
     * Model
     * @param {String} uid     controller id
     * @param {Function} factory 工厂方法
     */
    function DBModel(uid, factory) {
        var Validation = require('../controller/validation');
        var Model = require('../model/data');

        //pubSub对象
        var binder = new DataBinder(uid);

        var scope = {},
            accessorProperties = {},
            _DATA = {},
            data = factory(scope);

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
            }
            accessorProperties[prop] = accessor;

            //未劫持前首次触发
            // binder.trigger(uid + ":change", prop, val, scope);
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
                }
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
            },

            dataAttr = "data-bind-" + object_id,
            message = object_id + ":change",

            handler = function(event) {
                var target = event.target,
                    propName = target.getAttribute(dataAttr);
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
            if (propName === 'curIcon') {
                require('./handlers').iconHanlder(object_id, newVal);
                return;
            }

            var aElement = document.querySelectorAll("[" + dataAttr + "=" + propName + "]"),
                tagName;

            for (var i = 0, len = aElement.length; i < len; i++) {
                tagName = aElement[i].tagName.toLowerCase();

                //radio
                if (aElement[i].getAttribute('type') === 'radio') {
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
    }
});
