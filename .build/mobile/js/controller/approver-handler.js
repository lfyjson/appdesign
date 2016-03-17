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