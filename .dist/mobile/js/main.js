define("mobile/js/main", [ "./controller/load", "./view/templates", "./tools/method", "./model/data", "./model/search", "../../config/config", "./controller/watch", "./controller/file-handler", "./view/dialog", "./tools/slide", "./tools/base64", "./controller/detail-handler", "./controller/submit", "./controller/validation", "./model/approver", "./controller/approver-handler", "./tools/escape" ], function(require) {
    /**
     * 加载html
     */
    require("./controller/load").loadScript();
    /**
     * 共用方法
     */
    require("./tools/method");
    /**
     * 监听用户行为
     */
    require("./controller/watch").init();
});

define("mobile/js/controller/approver-handler", [ "../view/templates", "../tools/method", "../model/data", "../model/search", "../../../config/config", "../view/dialog", "../model/approver" ], function(require, exports) {
    var Template = require("../view/templates");
    var Model = require("../model/data");
    var Search = require("../model/search");
    var Dialog = require("../view/dialog");
    var m = require("../tools/method");
    var Approver = require("../model/approver").approver;
    var approver = {
        //已选中审批人列表
        oSelected: document.querySelector(".approver-list"),
        oMain: document.getElementById("main"),
        addHanlder: function() {
            //仅一个实例
            if (this.wrap) {
                return;
            }
            var html = Template.getWidget({
                type: "approverList"
            });
            this.wrap = m.parseDOM(html)[0];
            // this.wrap.style.height = document.body.scrollHeight + 'px';
            this.oList = this.wrap.querySelector(".select-approver-list");
            //提示DOM
            this.hint = this.wrap.querySelector(".no-approver");
            //添加列表项
            this.addListItem();
            //添加关闭列表事件
            this.closeBtn = this.wrap.querySelector(".approver-getback");
            this.closeBtn.on("tap", this.closeListHanlder.bind(this), false);
            //缓存scrollTop
            this.scrollTop = document.body.scrollTop;
            this.oMain.style.display = "none";
            document.body.appendChild(this.wrap);
            document.body.scrollTop = 0;
            //搜索功能
            this.input = this.wrap.querySelector(".approver-search-input");
            search.init(this.oList, this.input, this.hint);
        },
        closeListHanlder: function() {
            this.oMain.style.display = "block";
            document.body.removeChild(this.wrap);
            document.body.scrollTop = this.scrollTop;
            this.wrap = null;
        },
        //审批人列表项
        addListItem: function() {
            //审批人信息列表
            this.arr = Search.aApproverList;
            if (this.arr) {
                //添加审批人列表
                for (var i = 0; i < this.arr.length; i++) {
                    this.oList.innerHTML += Template.tApproverItem(this.arr[i].name, this.arr[i].personid);
                }
                //选择审批人处理
                this.selectHanlder();
            } else {
                this.hint.style.display = "block";
                this.hint.innerHTML = "没有可供选择的审批人";
            }
        },
        selectHanlder: function() {
            var self = this;
            //审批人列表
            this.aA = this.oList.querySelectorAll("a");
            for (var i = 0; i < this.aA.length; i++) {
                this.aA[i].index = i;
                this.aA[i].addEventListener("click", function(ev) {
                    //审批人
                    var name = self.arr[this.index].name;
                    var personid = self.arr[this.index].personid;
                    self.closeListHanlder();
                    //判断是否已经选择过此联系人
                    if (!Approver.exists(personid)) {
                        //获取DOM 
                        var sItem = Template.tSelectedApprover(name, personid);
                        var oItem = m.parseDOM(sItem)[0];
                        var frontItem = self.oSelected.querySelector("li");
                        //视图显示选择的审批人
                        self.oSelected.insertBefore(oItem, frontItem);
                        //模型增加审批人
                        Approver.add(name, personid);
                    } else {
                        Dialog.tips({
                            content: "该审批人已在列表中",
                            time: 1e3
                        });
                    }
                }, false);
            }
        },
        delHanlder: function(target) {
            //删除模型中的数据
            Approver.del(target.dataset.personid);
            //删除视图
            this.oSelected.removeChild(target.parentNode);
        }
    };
    var search = {
        init: function(oList, input, hint) {
            this.oList = oList;
            this.input = input;
            this.hint = hint;
            this.aList = this.oList.getElementsByTagName("a");
            this.input.addEventListener("input", this.filter.bind(this), false);
        },
        //过滤搜索
        filter: function() {
            var value = this.input.value;
            var len = 0;
            for (var i = 0; i < this.aList.length; i++) {
                if (this.aList[i].dataset.name.indexOf(value) === -1) {
                    this.aList[i].style.display = "none";
                } else {
                    this.aList[i].style.display = "block";
                    len++;
                }
            }
            if (len > 0) {
                this.hint.style.display = "none";
            } else {
                this.hint.style.display = "block";
                this.hint.innerHTML = "没有搜索到相关结果";
            }
        }
    };
    exports.approver = approver;
});

define("mobile/js/controller/detail-handler", [ "../view/templates", "../tools/method", "../model/data", "../view/dialog" ], function(require, exports, module) {
    var Templates = require("../view/templates");
    var m = require("../tools/method");
    /**
     * 增加明细
     */
    var add = {
        hanlder: function(target) {
            var oParent = target.parentNode;
            //获取数据集合
            var DATA = require("../model/data").DATA;
            //获取当前明细数据
            var data = this.getData(DATA["0"], target.dataset.id), //明细内二级控件
            seconds = DATA[target.dataset.id];
            //无数据时跳出
            if (data == null) return;
            //获取新增明细area html
            var html = Templates.tDetailInner(data.title, 2, true);
            //转换DOM
            var DOM = m.parseDOM(html), oTitle = DOM[0], oArea = DOM[1];
            //插入标题
            oParent.insertBefore(oTitle, target);
            //插入area
            oParent.insertBefore(oArea, target);
            //设置明细列表索引
            setNum(oParent.querySelectorAll(".detail-num"));
            //插入二级控件
            this.insertWidget(oArea, seconds);
        },
        getData: function(datas, id) {
            for (var i = 0; i < datas.length; i++) {
                if (datas[i].id == id) {
                    return datas[i];
                }
            }
            return null;
        },
        insertWidget: function(wrap, widgets) {
            for (var i = 0; i < widgets.length; i++) {
                wrap.innerHTML += Templates.getWidget(widgets[i]);
            }
        }
    };
    /**
     * 删除明细
     */
    var del = {
        handler: function(target) {
            var self = this;
            var oDialog = require("../view/dialog").dialog({
                content: "你确定要删除吗？"
            });
            oDialog.btnTrue.on("tap", function() {
                self.removeDetail(target);
            }, false);
        },
        removeDetail: function(target) {
            var oTitle = target.parentNode;
            var oArea = oTitle.nextElementSibling;
            var oParent = oTitle.parentNode;
            oParent.removeChild(oTitle);
            oParent.removeChild(oArea);
            setNum(oParent.querySelectorAll(".detail-num"));
        }
    };
    /**
     * 设置明细列表索引
     * @param {Object} nums num标签集合
     */
    function setNum(nums) {
        for (var i = 0; i < nums.length; i++) {
            nums[i].innerHTML = i + 1;
        }
    }
    exports.add = add;
    exports.del = del;
});

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

define("mobile/js/controller/load", [ "../view/templates", "../tools/method", "../model/data", "../model/search", "../../../config/config" ], function(require, exports) {
    var Templates = require("../view/templates");
    var Model = require("../model/data");
    var Search = require("../model/search");
    var Path = require("../../../config/config").Path;
    var m = require("../tools/method");
    var script;
    function loadScript() {
        if (!!Search.oSearch && Search.oSearch.tplid !== "undefined") {
            script = document.createElement("script");
            script.src = Path.mobileDataPath + Search.oSearch.tplid + ".js";
            document.body.appendChild(script);
        }
    }
    window.loadWidget = function(data) {
        //格式化数据
        Model.format(data);
        //格式化后的数据
        var DATA = Model.DATA;
        var pageTitle = DATA["-1"][0].title;
        if (pageTitle) document.title = pageTitle;
        //顶级控件
        var aTop = DATA["0"];
        //加载主体标签
        var main = Templates.getMain();
        document.body.appendChild(main);
        for (var i = 0; i < aTop.length; i++) {
            //控件DOM
            var oItem = m.parseDOM(Templates.getWidget(aTop[i]))[0];
            //添加控件DOM
            main.appendChild(oItem);
            if (aTop[i].type == "detail") {
                var oArea = oItem.querySelector(".detail-area");
                //当前明细内控件集合
                var seconds = DATA[aTop[i].id];
                //添加明细内控件
                for (var j = 0; j < seconds.length; j++) {
                    var html = Templates.getWidget(seconds[j]);
                    oArea.innerHTML += html;
                }
            }
        }
        // //审批人
        // main.innerHTML += Templates.getWidget({
        //     type: 'approver'
        // });
        // //提交按钮
        // main.innerHTML += Templates.getWidget({
        //     type: 'submit'
        // });
        //删除script
        if (script && script.parentNode) document.body.removeChild(script);
    };
    exports.loadScript = loadScript;
});

define("mobile/js/controller/submit", [ "./validation", "../model/data", "../view/dialog", "../tools/method", "../model/approver", "../../../config/config", "../model/search" ], function(require, exports) {
    var Validation = require("./validation");
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var m = require("../tools/method");
    var Approver = require("../model/approver").approver;
    function submit() {
        //验证表单
        var valid = Validation.check();
        if (valid) {
            var page = Model.DATA[-1]["0"];
            var item = "&itemname=" + (page.title ? page.title : "暂无");
            item += "&itemdesc=" + (page.explain ? page.explain : "暂无");
            var param = "data=" + JSON.stringify(getFormatData()) + "&" + Search.sSearch;
            //项目简介
            param += item;
            //url前缀
            param += "&urlprefix=" + Search.getUrlPrefix();
            //是否启用
            param += "&isvalid=" + (page.enabled ? 1 : 0);
            //已选择审批人
            param += Approver.get();
            //icon图标
            param += "&iconurl=" + page.iconURL;
            console.log(param);
            m.ajax({
                type: "post",
                url: Path.submit,
                data: param,
                beforeSend: function() {
                    Dialog.tips({
                        type: "loading",
                        content: "正在努力提交中..."
                    });
                },
                success: function(data) {
                    data = JSON.parse(data);
                    console.log(data);
                    if (data.status == 200) {
                        success(data);
                    } else {
                        error(data);
                    }
                },
                error: error
            });
        }
    }
    function success(data) {
        Dialog.tips({
            content: "提交成功",
            time: 1500,
            onTimeEnd: function() {
                //提交成功后跳转到成功页面
                if (data.fdurl) {}
            }
        });
    }
    function error(data) {
        Dialog.tips({
            content: data.msgdesc ? data.msgdesc : "提交失败",
            time: 1500
        });
    }
    //获取键值对格式化数据
    function getFormatData() {
        var widgets = document.querySelectorAll('div[data-parentid="0"]');
        return getWidgetsData(widgets);
    }
    //获取控件键值对数据
    function getWidgetsData(widgets) {
        var json = {};
        for (var i = 0; i < widgets.length; i++) {
            var widget = widgets[i];
            //获取控件数据
            var data = Model.DATA[widget.dataset.parentid][widget.dataset.order - 1];
            if (get[data.type]) {
                json[i + "." + data.type] = get[data.type](widget, data);
            }
        }
        return json;
    }
    //获取不同类型控件键值对
    var get = {
        text: function(widget, data) {
            var json = {};
            var value = widget.querySelector("[data-native]").value;
            json[data.title] = value;
            return json;
        },
        textare: function(widget, data) {
            return this.text(widget, data);
        },
        number: function(widget, data) {
            return this.text(widget, data);
        },
        date: function(widget, data) {
            return this.text(widget, data);
        },
        radio: function(widget, data) {
            var json = {};
            var sel = widget.querySelector("[data-native]");
            if (!sel.dataset.enabled) {
                //单选框未选择时,值为空
                json[data.title] = "";
            } else {
                json[data.title] = sel.value;
            }
            return json;
        },
        dateRange: function(widget, data) {
            var json = {};
            var inputs = widget.querySelectorAll("[data-native]");
            json[data.title] = inputs[0].value;
            json[data.title2] = inputs[1].value;
            return json;
        },
        image: function(widget, data) {
            var json = {};
            var imgs = widget.querySelectorAll("img");
            for (var i = 0; i < imgs.length; i++) {
                var URL = {
                    thumbURL: imgs[i].src,
                    naturalURL: imgs[i].dataset.src
                };
                json[imgs[i].dataset.imgid] = URL;
            }
            console.log(json);
            return json;
        },
        detail: function(widget, data) {
            var json = {};
            var aArea = widget.querySelectorAll(".detail-area");
            for (var i = 0; i < aArea.length; i++) {
                var widgets = aArea[i].querySelectorAll("div[data-parentid]");
                json[data.title + "(" + i + ")"] = getWidgetsData(widgets);
            }
            return json;
        }
    };
    exports.submit = submit;
});

define("mobile/js/controller/validation", [ "../model/data", "../view/dialog", "../tools/method", "../model/approver" ], function(require, exports) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var m = require("../tools/method");
    var Approver = require("../model/approver").approver;
    function check() {
        //获取所有控件
        var widgets = document.querySelectorAll("div[data-order]");
        for (var i = 0; i < widgets.length; i++) {
            var widget = widgets[i];
            //获取控件数据
            var data = Model.DATA[widget.dataset.parentid][widget.dataset.order - 1];
            //验证
            var text;
            if (validate[data.type]) {
                text = validate[data.type](widget, data);
            }
            //会话框提示
            if (text != null) {
                Dialog.tips({
                    content: text,
                    time: 1500
                });
                break;
            }
        }
        //审批人判断
        if (Approver.toid.length < 1 && !text) {
            text = "请选择审批人";
            Dialog.tips({
                content: text,
                time: 1500
            });
        }
        //返回验证结果
        if (!!text && text.length > 0) {
            return false;
        } else {
            return true;
        }
    }
    var maxLength = {
        text: 20,
        textarea: 400,
        number: 20
    };
    //控件验证
    var validate = {
        text: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            var str = input.value;
            var max = maxLength[data.type];
            if (data.require && str.length < 1) {
                return emptyHint(data);
            } else if (m.strlen(str) > max[data.type]) {
                return data.title + "最多输入" + max + "个字";
            }
        },
        textarea: function(widget, data) {
            return this.text(widget, data);
        },
        number: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            var str = input.value;
            var max = maxLength[data.type];
            if (data.require && str.length < 1) {
                return emptyHint(data);
            } else if (str.length > max) {
                return data.title + "最多输入" + max + "个数字";
            }
        },
        radio: function(widget, data) {
            var sel = widget.querySelector("[data-native]");
            //单选框是否选择	
            if (data.require && !sel.dataset.enabled) {
                return emptyHint(data);
            }
        },
        date: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            if (data.require && input.value.length < 1) {
                return emptyHint(data);
            }
        },
        dateRange: function(widget, data) {
            var inputs = widget.querySelectorAll("[data-native]");
            var begin = inputs[0].value;
            var end = inputs[1].value;
            if (data.require) {
                if (begin.length < 1) {
                    return "请选择" + data.title;
                } else if (end.length < 1) {
                    return "请选择" + data.title2;
                }
            }
            if (begin.length > 0 && end.length > 0) {
                var beginTime = new Date(begin).getTime();
                var endTime = new Date(end).getTime();
                if (beginTime > endTime) {
                    return data.title + "不能大于" + data.title2;
                }
            }
        },
        image: function(widget, data) {
            var aImg = widget.querySelectorAll("img");
            if (data.require && aImg.length < 1) {
                return emptyHint(data);
            }
        }
    };
    /**
     * 必填项为空时的提示
     * @param  {Object} data 当前控件json数据
     * @return {String}      提示文字
     */
    function emptyHint(data) {
        //验证有效性为false
        switch (data.type) {
          case "date":
            return "请选择" + data.title;
            break;

          case "image":
            return "请上传" + data.title;
            break;

          case "number":
            return data.title + "不能为空且必须为数字";
            break;

          case "radio":
            return "请选择" + data.title;
            break;

          default:
            return data.title + "内容不能为空";
        }
    }
    exports.check = check;
});

define("mobile/js/controller/watch", [ "./file-handler", "../view/dialog", "../../../config/config", "../model/search", "../tools/method", "../tools/slide", "../tools/base64", "./detail-handler", "../view/templates", "../model/data", "./submit", "./validation", "../model/approver", "./approver-handler", "../tools/escape" ], function(require, exports) {
    function init() {
        //监听input
        document.addEventListener("input", nativeHanlder, false);
        //监听change
        document.addEventListener("change", nativeHanlder, false);
        //监听tap
        document.on("tap", touchendHanlder);
    }
    //tap处理
    function touchendHanlder(ev) {
        var target = ev.target;
        switch (target.dataset.action) {
          case "delete-image":
            //删除图片
            require("./file-handler").del.hanlder(target);
            break;

          case "delete-detail":
            //删除明细
            require("./detail-handler").del.handler(target);
            break;

          case "add-detail":
            //增加明细
            require("./detail-handler").add.hanlder(target);
            break;

          case "submit":
            //提交
            require("./submit").submit();
            break;

          case "add-approver":
            //增加审批人
            setTimeout(function() {
                require("./approver-handler").approver.addHanlder();
            }, 350);
            break;

          case "del-approver":
            //删除审批人
            require("./approver-handler").approver.delHanlder(target);
        }
    }
    //单选&日期&上传处理
    function nativeHanlder(ev) {
        var target = ev.target;
        var value = target.value;
        if (!target.classList.contains("item-native")) return;
        if (target.getAttribute("type") === "file") {
            //上传图片
            require("./file-handler").upload.hanlder(target);
        } else if (value !== "请选择" && value !== "请选择（必填）") {
            var oText = target.previousElementSibling;
            oText.classList.remove("item-prompt");
            target.dataset.enabled = true;
            if (target.getAttribute("type") === "datetime") {
                oText.innerHTML = getDateTime(value);
            } else {
                //XXS过滤
                oText.innerHTML = require("../tools/escape").escape(value);
            }
        }
    }
    function getDateTime(datetime) {
        var oDate = new Date(datetime);
        var date = oDate.getFullYear() + "-" + zeroize(oDate.getMonth() + 1) + "-" + zeroize(oDate.getDate());
        var time = " " + zeroize(oDate.getHours()) + ":" + zeroize(oDate.getMinutes());
        return date + time;
    }
    function zeroize(num) {
        if (num > 9) {
            return num;
        } else {
            return "0" + num;
        }
    }
    exports.init = init;
});

define("mobile/js/model/approver", [], function(require, exports, module) {
    var approver = {
        //已选择的审批人
        torealname: [],
        toid: [],
        //增加已选择的审批人
        add: function(name, id) {
            this.torealname.push(name);
            this.toid.push(id);
        },
        //是否有此审批人
        exists: function(id) {
            if (this.toid.indexOf(id) === -1) {
                return false;
            } else {
                return true;
            }
        },
        //删除已选择的审批人
        del: function(id) {
            var index = this.toid.indexOf(id);
            console.log(index);
            if (index > -1) {
                this.torealname.splice(index, 1);
                this.toid.splice(index, 1);
            }
        },
        //得到格式化后的审批人数据
        get: function() {
            return "&toid=" + this.toid.join(",") + "&torealname=" + this.torealname.join(",");
        }
    };
    window.abc = approver;
    exports.approver = approver;
});

define("mobile/js/model/data", [], function(require, exports, module) {
    var DATA = {};
    window.temp = DATA;
    /**
     * 格式化数据
     * @param  {String} data 数据
     */
    function format(data) {
        var arr = parseData(data);
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
    module.exports = {
        DATA: DATA,
        format: format,
        getData: getData
    };
});

define("mobile/js/model/search", [ "../tools/method", "../../../config/config" ], function(require, exports) {
    var m = require("../tools/method");
    //location.search
    var sSearch = getSearch(), oSearch, aApproverList;
    //search json键值对
    if (sSearch !== null) {
        oSearch = parseSearch(sSearch);
    }
    //审批人列表
    if (oSearch && oSearch.torealname) {
        aApproverList = oSearch.torealname.split(",");
    }
    //得到location.search值
    function getSearch() {
        var search = decodeURI(window.location.search);
        if (search.indexOf("?") != -1) {
            var str = search.substr(1);
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
    /**
     * 获取url前缀
     * @return {String}     url前缀
     */
    function getUrlPrefix() {
        var pathName = window.location.origin + window.location.pathname;
        return pathName.substring(0, pathName.lastIndexOf("/") + 1);
    }
    // getApproverList();
    function getApproverList() {
        if (oSearch && oSearch.tplid) {
            //获取审批人信息
            m.ajax({
                type: "post",
                url: require("../../../config/config").Path.getApprover,
                data: sSearch,
                success: function(data) {
                    data = JSON.parse(data);
                    if (data.status === 200) {
                        console.log(data);
                        aApproverList = data.result;
                        exports.aApproverList = aApproverList;
                    }
                },
                error: function() {
                    console.log("无");
                }
            });
        }
    }
    exports.sSearch = sSearch;
    exports.oSearch = oSearch;
    exports.getUrlPrefix = getUrlPrefix;
    exports.aApproverList = aApproverList;
});

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

define("mobile/js/tools/escape", [], function(require, exports, module) {
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

define("mobile/js/tools/method", [], function(require, exports, module) {
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
    };
    //触发事件
    Node.prototype.trigger = function(type, ev) {
        if (this.listeners && this.listeners[type]) {
            for (var i = 0; i < this.listeners[type].length; i++) {
                this.listeners[type][i].call(this, ev);
            }
        }
    };
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
            this.addEventListener("touchstart", function(ev) {
                var touches = ev.touches[0];
                startTx = touches.clientX;
                startTy = touches.clientY;
            }, false);
            this.addEventListener("touchend", function(ev) {
                var touches = ev.changedTouches[0], endTx = touches.clientX, endTy = touches.clientY;
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
            this.addEventListener("touchstart", function(ev) {
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
                }, 1e3, this);
                ev.preventDefault();
            }, false);
            this.addEventListener("touchmove", function(ev) {
                var touches = ev.touches[0], tx = touches.clientX, ty = touches.clientY;
                if (lTapTimer && (Math.abs(tx - startTx) > 5 || Math.abs(ty - startTy) > 5)) {
                    clearTimeout(lTapTimer);
                    lTapTimer = null;
                }
            }, false);
            this.addEventListener("touchend", function(ev) {
                if (lTapTimer) {
                    clearTimeout(lTapTimer);
                    lTapTimer = null;
                }
            }, false);
        }
    };
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
    };
});

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

define("mobile/js/view/dialog", [], function(require, exports, module) {
    var param;
    function dialog() {
        param = arguments[0];
        closeAll();
        var dialog = tMask(true);
        return dialog;
    }
    function tips() {
        param = arguments[0];
        closeAll();
        var dialog = tMask(false);
        if (param.type !== "loading") {
            setTimeout(function() {
                dialog.close();
                param.onTimeEnd && param.onTimeEnd();
            }, param.time ? param.time : 2e3);
        }
        return dialog;
    }
    function tMask(isBtn) {
        var mask = document.createElement("div");
        mask.classList.add("mask");
        mask.style.height = document.body.scrollHeight + "px";
        mask.innerHTML = tDialog(isBtn);
        document.body.appendChild(mask);
        btnTrue = mask.querySelector("input[data-type=yes]");
        btnFalse = mask.querySelector("input[data-type=no]");
        main = mask.querySelector(".dialog-main");
        //按钮绑定事件
        btnTrue && bindEvent(btnTrue, mask);
        btnFalse && bindEvent(btnFalse, mask);
        return {
            mask: mask,
            main: main,
            btnTrue: btnTrue,
            btnFalse: btnFalse,
            close: close.bind(mask)
        };
    }
    function close() {
        // this.style.opacity = 0;
        // this.addEventListener('webkitTransitionEnd', function () {
        if (this && this.parentNode) {
            this.parentNode.removeChild(this);
        }
        document.body.style.pointerEvents = "none";
        setTimeout(function() {
            document.body.style.pointerEvents = "auto";
        }, 320);
    }
    function closeAll() {
        var aMask = document.querySelectorAll(".mask");
        for (var i = 0; i < aMask.length; i++) {
            aMask[i].parentNode.removeChild(aMask[i]);
        }
    }
    function bindEvent(btn, mask) {
        btn.addEventListener("touchend", close.bind(mask), false);
    }
    function tDialog(isBtn) {
        //padding setting
        var padding = param.padding ? 'style="padding:' + param.padding + '"' : "";
        var content;
        if (param.type === "loading") {
            content = '<i class="tips-loading"></i>' + param.content;
        } else {
            content = param.content;
        }
        return [ '<div class="dialog">', '<div class="dialog-main" ' + padding + ">" + content + "</div>", isBtn ? tBtns() : "", "</div>" ].join("");
    }
    function tBtns() {
        return [ '<div class="dialog-btns">', '<input type="button" data-type="no" value="取消" />', '<input type="button" data-type="yes" value="确定" />', "</div>" ].join("");
    }
    exports.dialog = dialog;
    exports.tips = tips;
});

define("mobile/js/view/templates", [ "../tools/method" ], function(require, exports) {
    var m = require("../tools/method");
    var data, require, requireText, flag;
    /**
	 * main
	 * @return {Object} 主体标签
	 */
    function getMain() {
        var main = m.create("section");
        main.classList.add("main");
        main.id = "main";
        return main;
    }
    function getWidget(param) {
        data = param;
        //dataId = 'data-id=' + data.id;
        dataId = "data-native=true";
        requireText = data.require;
        flag = "data-parentId=" + data.parentId + " data-order=" + data.order;
        switch (data.type) {
          case "radio":
            return tRadio();

          case "date":
            return tDate();

          case "dateRange":
            return tDateRange();

          case "image":
            return tImage();

          case "detail":
            return tDetail();

          case "submit":
            return tSubmit();

          case "approver":
            //审批人
            return tApprover();

          case "approverList":
            //添加审批人列表
            return tAddApprover();

          default:
            return tText();
        }
    }
    function tText() {
        var input = "";
        var type = data.type == "number" ? "number" : "text";
        if (data.type == "textarea") {
            input = '<textarea type="text" class="item-text" ' + dataId + ' placeholder="' + data.prompt + requireText + '"></textarea>';
        } else {
            input = '<input type="' + type + '" class="item-text" ' + dataId + ' placeholder="' + data.prompt + requireText + '" />';
        }
        return [ '<div class="form-item-' + data.type + '" ' + flag + ">", '<div class="item-border">', '<label for="" class="item-title">', data.title, "</label>", '<span class="item-text-wrap">', input, "</span>", "</div>", "</div>" ].join("");
    }
    function tRadio() {
        // var options = '';
        var options = '<option value="请选择' + requireText + '">请选择' + requireText + "</option>";
        for (var i = 0; i < data.options.length; i++) {
            options += '<option value="' + data.options[i] + '">' + data.options[i] + "</option>";
        }
        return [ '<div class="form-item-radio" ' + flag + ">", '<div class="item-border">', '<label for="" class="item-title">', data.title, "</label>", '<span class="item-native-text item-prompt">请选择' + requireText + "</span>", '<select class="item-native" ' + dataId + ">", options, "</select>", "</div>", "</div>" ].join("");
    }
    function tDate() {
        return [ '<div class="form-item-date"  ' + flag + ">", tDateInner(data.title), "</div>" ].join("");
    }
    function tDateRange() {
        return [ '<div class="form-item-dateRange"  ' + flag + ">", tDateInner(data.title), tDateInner(data.title2), "</div>" ].join("");
    }
    function tDateInner(title) {
        return [ '<div class="item-border">', '<label for="" class="item-title">', title, "</label>", '<span class="item-native-text  item-prompt">请选择' + requireText + "</span>", '<input type="' + data.datetype + '" class="item-native" ' + dataId + " />", "</div>" ].join("");
    }
    function tImage() {
        var requireText = data.require ? '<span class="item-prompt">（必填）</span>' : "";
        return [ '<div class="form-item-image"  ' + flag + ">", '<div class="item-border">', '<label for="" class="item-title">', data.title, requireText, '<input type="file" accept="image/*" class="item-native" />', "</label>", '<div class="image-list" ' + dataId + ' data-role="photo">', "</div>", "</div>", "</div>" ].join("");
    }
    function tDetail() {
        return [ '<div class="form-item-detail"  ' + flag + ">", tDetailInner(data.title, 1), '<div class="detail-add" data-action="add-detail" data-id=' + data.id + ">" + data.addDetail + "</div>", "</div>" ].join("");
    }
    function tDetailInner(title, num, isDelete) {
        return [ '<div class="detail-title-wrap">', '<label for="" class="detail-title">' + title + '(<em class="detail-num">' + num + "</em>)</label>", isDelete ? '<a class="detail-delete" data-action="delete-detail">删除</a>' : "", "</div>", '<div class="detail-area"  ' + dataId + ">", "</div>" ].join("");
    }
    function tSubmit() {
        return [ '<div class="submit-btn-wrap">', '<input type="button" value="提交" class="submit-btn" data-action="submit" />', "</div>	" ].join("");
    }
    //审批人
    function tApprover() {
        return [ '<div class="form-item-approver">', '<div class="item-border">', '<label class="approver-title">审批人<em>(点击头像可删除)</em></label>', '<ul class="approver-list">', "<li>", '<a class="add-approver" data-action="add-approver"></a>', "</li>", "</ul>", "</div>", "</div>" ].join("");
    }
    //添加审批人
    function tAddApprover() {
        return [ '<section class="select-approver">', '<div class="approver-header">', '<a class="approver-getback"></a>', "添加审批人", "</div>", '<div class="approver-search">', '<input type="text" class="approver-search-input" placeholder="搜索姓名">', "</div>", '<div class="select-approver-list">', "</div>", '<div class="no-approver"></div>', "</section>	" ].join("");
    }
    function tApproverItem(name, id) {
        return '<a data-personid="' + id + '" data-name="' + name + '"><em>' + name + "</em>" + name + "</a>";
    }
    function tSelectedApprover(name, id) {
        return '<li><span  data-name="' + name + '" data-personid="' + id + '" data-action="del-approver">' + name + "</span><em>" + name + "</em></li>";
    }
    exports.getMain = getMain;
    exports.getWidget = getWidget;
    exports.tDetailInner = tDetailInner;
    exports.tApproverItem = tApproverItem;
    exports.tSelectedApprover = tSelectedApprover;
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
        // mobileDataPath: '../php/data/'
        mobileDataPath: "http://appdesign-design.stor.sinaapp.com/data/"
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
