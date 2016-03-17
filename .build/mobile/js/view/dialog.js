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