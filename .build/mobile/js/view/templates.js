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