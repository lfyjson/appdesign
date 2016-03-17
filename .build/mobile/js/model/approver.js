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