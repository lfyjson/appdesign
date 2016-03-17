define(function(require, exports, module) {
    var Model = require('../model/data'); //model
    var m = require('../tools/method');

    var description = {
        'title': '标题',
        'prompt': '提示文字',
        'addDetail': '动作名称'
    }

    function verify() {
        var DATA = Model.DATA;
        for (var i = 1; i < DATA.length; i++) {
            //获取无效性对象
            var invalid = DATA[i].invalid;
            for (key in invalid) {
                if (invalid[key]) {
                    return {
                        id: DATA[i].id,
                        text: '组件' + description[key] + DATA[i].verifyText[key]
                    }
                }
            }

            //检测明细组件中是否有组件
            if (DATA[i].type == 'detail') {
                var num = 0;
                for (var j = 0; j < DATA.length; j++) {
                    if (DATA[j].parentId == DATA[i].id) num++;
                }
                if (!num) {
                    return {
                        id: DATA[i].id,
                        text: '请添加组件到' + DATA[i].title + '中'
                    }
                }
            }
        }

        var invalid = DATA[0].invalid;
        for (key in invalid) {
            if (invalid[key]) {
                return 'show-save-dialog';
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
        var remark = input.parentNode.previousElementSibling.querySelector('.remark');
        var isTitle = !!(model == 'title');

        //判断长度
        if (len > max) {
            addError(input, remark, data, model);
        } else {
            removeError(input, remark, data, model);
        }

        //标题提示语更换
        if (isTitle) {
            if (len == 0) {
                if (input.dataset.error == 'hide') {
                    //data-error=hide时隐藏错误提示样式
                    addError(input, remark, data, model, true);
                } else {
                    addError(input, remark, data, model);
                }
                if (data.id == 0) {
                    Model.updateData(data, model, '请输入审批名称，最多10个字', 'verifyText');
                } else {
                    Model.updateData(data, model, '不能为空', 'verifyText');
                }
            } else {
                if (data.id == 0) {
                    Model.updateData(data, model, '请输入审批名称，最多10个字', 'verifyText');
                } else {
                    Model.updateData(data, model, '最多' + max + '个字', 'verifyText');
                }
            }
            remark.innerHTML = data.verifyText[model]
        }

        return textLimit(data, model, input, newVal);
    }


    function addError(input, remark, data, model, hideStyle) {
        if (!hideStyle) {
            input.classList.add('error');
            remark.classList.add('error');
        }
        Model.updateData(data, model, true, 'invalid');
    }

    function removeError(input, remark, data, model) {
        input.classList.remove('error');
        remark.classList.remove('error');
        Model.updateData(data, model, false, 'invalid');
    }

    /**
     * 选项数据验证
     * @param  {object} input inputDOM
     * @return {string}       符合规则的数据
     */
    function optionVerify(input) {
        var value = input.value;
        if (value === '请选择' || value === '请选择（必填）') {
            return '';
        }
        var len = m.strlen(value);

        if (len > 20) {
            return m.substr(value, 20);
        }
    }

    //input textarea字符截取
    function textLimit(data, model, target, newVal) {
        //当无效性为true时且不是页面设置时，进行字符串截取
        if (data.invalid[model] && data.type !== 'pageName') {
            return m.substr(newVal, data.validationRule[model]);
        } else {
            return newVal;
        }
    }

    //双向数据绑定数据验证
    function DBModelVerify(attrName, newVal, target, id, scope) {
        var type = target.getAttribute('type');
        var tagName = target.tagName.toLowerCase();

        //text textarea 验证
        if (type === 'text' || tagName === 'textarea') {
            newVal = inputVerify(target, attrName, Model.getData(id), newVal);
        }

        //checkbox
        if (target.getAttribute('type') === 'checkbox') {
            if (target.checked) {
                newVal = target.dataset.trueValue;
            } else {
                newVal = target.dataset.falseValue;
            }
        }

        //图标
        if (attrName === 'curIcon') {
            newVal = target.dataset.value;
            scope['iconURL'] = target.src;
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
