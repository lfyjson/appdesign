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