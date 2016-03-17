define(function(require, exports, module) {
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
        var oDiv = document.createElement('div');
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
        if (typeof wrap.contains == 'function') {
            return wrap.contains(inner);
        } else if (typeof wrap.compareDocumentPosition == 'function') {
            return !!(wrap.compareDocumentPosition(inner) & 16);
        }
    }

    //截取中英文字符
    function substr(str, len) {
        var char_length = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加0.5
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                char_length += 0.5;
            } else {
                char_length += 1
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
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                len++;
            } else {
                len += 2;
            }
        }
        return Math.ceil(len / 2);
    }


    function loadHtml(src) {
        var script = create('script');
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

        if (type === 'Object') {
            newObj = {};
        } else if (type === 'Array') {
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

        if (param.type != 'post') {
            param.type = 'get';
            if (param.data) {
                param.url += '?' + param.data;
            }
        }

        xhr.open(param.type, param.url, true);
        if (param.type == 'get') {
            xhr.send();
        } else {
            xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
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
        }
    }

    //绑定事件
    Node.prototype.on = function(type, fn) {
        this.listeners = this.listeners || {};
        this.listeners[type] = this.listeners[type] || [];
        this.listeners[type].push(fn);

        for (key in CustomEvent) {
            if (CustomEvent.hasOwnProperty(key)) {
                if (key === type) {
                    //绑定自定义事件
                    CustomEvent.builder.call(this, type);
                }
            }
        }
    }
    //触发事件
    Node.prototype.trigger = function(type, ev) {
        if (this.listeners && this.listeners[type]) {
            for (var i = 0; i < this.listeners[type].length; i++) {
                this.listeners[type][i].call(this, ev);
            }
        }
    }
    
    //自定义事件
    var CustomEvent = {
        builder: function(type) {
            //同一对象自定义事件只能绑定一次 
            if (!this.CustomEvent) {
                this.CustomEvent = {};
            }
            if (this.CustomEvent[type]) {
                return;
            }
            this.CustomEvent[type] = true;

            //增加相应事件
            CustomEvent[type].call(this, type);
        },
        //tap事件
        tap: function(type) {
            var startTx, startTy;
            this.addEventListener('touchstart', function(ev) {
                var touches = ev.touches[0];

                startTx = touches.clientX;
                startTy = touches.clientY;
            }, false);

            this.addEventListener('touchend', function(ev) {
                var touches = ev.changedTouches[0],
                    endTx = touches.clientX,
                    endTy = touches.clientY;

                if (Math.abs(startTx - endTx) < 6 && Math.abs(startTy - endTy) < 6) {
                    setTimeout(function(self) {
                        //执行自定义事件集合
                        self.trigger(type, ev);
                    }, 10, this);
                }
            }, false);
        },
        //longTap事件
        longTap: function(type) {
            var startTx, startTy, lTapTimer;

            this.addEventListener('touchstart', function(ev) {
                if (lTapTimer) {
                    clearTimeout(lTapTimer);
                    lTapTimer = null;
                }

                var touches = ev.touches[0];

                startTx = touches.clientX;
                startTy = touches.clientY;

                lTapTimer = setTimeout(function(self) {
                    //触发事件
                    self.trigger(type, ev);
                }, 1000, this);

                ev.preventDefault();
            }, false);

            this.addEventListener('touchmove', function(ev) {
                var touches = ev.touches[0],
                    tx = touches.clientX,
                    ty = touches.clientY;

                if (lTapTimer && (Math.abs(tx - startTx) > 5 || Math.abs(ty - startTy) > 5)) {
                    clearTimeout(lTapTimer);
                    lTapTimer = null;
                }
            }, false);

            this.addEventListener('touchend', function(ev) {
                if (lTapTimer) {
                    clearTimeout(lTapTimer);
                    lTapTimer = null;
                }
            }, false);
        }
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
        ajax: ajax
    }
});
