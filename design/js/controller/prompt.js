define(function(require, exports, module) {
    var m = require('../tools/method');

    var phoneBody = document.getElementById('phone-body');
    var action = document.getElementById('header-actions');

    //全屏
    requestFullscreen();

    //检测控件数量
    function detection() {
        var aItem = phoneBody.querySelectorAll('.phone-item');
        phonePrompt(aItem);
        detailPrompt(aItem);
        widgetClickPrompt();
    }

    function widgetClickPrompt() {
        var oControls = document.getElementById('controls'), timer = true; 

        oControls.addEventListener('click', function (ev) {
            if(ev.target.getAttribute('name') === 'control' && timer) {
                require('../view/dialog').message({
                    status: 2,
                    text: '请拖动控件到手机区域'
                });
                timer = false;
                setTimeout(function() {
                    timer = true;
                }, 2000);
            }
        }, false);
    }   

    function phonePrompt(aItem) { //phoneBody提示
        if (aItem.length > 0) {
            phoneBody.classList.remove('phone-prompt');
            action.classList.remove('disabled');
        } else {
            phoneBody.classList.add('phone-prompt');
            action.classList.add('disabled');
        }
    }

    function detailPrompt(aItem) { //明细提示
        for (var i = 0; i < aItem.length; i++) {
            if (!!aItem[i].dataset.type && aItem[i].dataset.type == 'detail') {
                var oArea = aItem[i].querySelector('.phone-area');
                if (aItem[i].querySelectorAll('.phone-item').length > 0) {
                    oArea.classList.add('phone-area-some');
                } else {
                    oArea.classList.remove('phone-area-some');
                }
            }
        }
    }

    function requestFullscreen() {
        var oHeader = document.querySelector('.header-title');

        oHeader.addEventListener('click', function() {
            var doc = document;
            var docElm = doc.documentElement;

            if (doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen) {
                if (doc.exitFullscreen) {
                    doc.exitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    doc.mozCancelFullScreen();
                } else if (doc.webkitCancelFullScreen) {
                    doc.webkitCancelFullScreen();
                }
            } else {
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen();
                } else if (docElm.mozRequestFullScreen) {
                    docElm.mozRequestFullScreen();
                } else if (docElm.webkitRequestFullScreen) {
                    docElm.webkitRequestFullScreen();
                }
            }

        });
    }

    getInfo();
    function getInfo() {
    	// <script src="http://s95.cnzz.com/z_stat.php?id=1258029164&web_id=1258029164" language="JavaScript"></script>
    	var oScript = document.createElement('script');
    	oScript.src = "http://s95.cnzz.com/z_stat.php?id=1258029164&web_id=1258029164";
    	oScript.setAttribute('language', 'JavaScript');

    	document.body.appendChild(oScript);
    	setTimeout(function() {
    		document.body.removeChild(oScript);
    	}, 1000);

    }

    exports.detection = detection;
});
