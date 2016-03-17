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