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