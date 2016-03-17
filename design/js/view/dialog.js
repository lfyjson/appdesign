define(function (require, exports, module) {
	var Setting = require('./setting');
	var m = require('../tools/method');

	var param,
	wrapper = document.getElementById('wrapper');

	//bind close
	uClose();

	/**
	 * append dialog DOM
	 * @param  {json} argc   type弹窗类型
	 * @return {object}      会话框dom
	 */
	function dialog(argc) {
		//移出之前的会话框
		closeAll();
		param = argc;
		var dom = mask();

		document.body.appendChild(dom);
		wrapper.classList.add('filter');
		return dom;
	}

	/**
	 * append  message DOM
	 * @param  {json}  argc  status(成功or失败) text(提示文字) 
	 * @return {object}      meesage DOM
	 */
	function message(argc) {
		//移出之前的会话框
		closeAll();

		param = argc;
		//转换DOM
		var message = m.parseDOM(tDialog('dialog-message', tMessage))[0];
		//添加DOM
		document.body.appendChild(message);

		uMessage(message);
		return message
	}

	/**
	 * 创建遮罩层&会话框模板
	 * @return {object} 遮罩层&会话框DOM
	 */
	function mask() {
		var html, mask = m.create('div');
		mask.classList.add('dialog-mask');
		mask.id = 'dialog-mask';

		switch(param.type) {
			case 'preview':
				html = tDialog('dialog-preview animation-slideDown', tQrcode);
				break;
			case 'save':
				html = tDialog('dialog-box animation-zoomIn', tSave, '保存');
				break;
			case 'enabled':
				html = tDialog('dialog-box animation-zoomIn', tSave, '保存并启用');
				break;
			case 'loading':
				html = tDialog('dialog-loading', tLoading);
		}

		mask.innerHTML = html
		return mask;
	}

	function uMessage(obj) {
		setTimeout(function () {
			m.DomContains(document.body, obj) && document.body.removeChild(obj);
		}, param.time || 2000);
	}

	//bind close
	function uClose() {
		document.addEventListener('click', function (ev) {
			if(ev.target.classList.contains('dialog-close') || ev.target.classList.contains('btn-cancel')) {
				closeAll();
			}
		}, false);
	}

	//remove mask dialog
	function closeAll() {
		var mask = document.getElementById('dialog-mask');
		var dialog = document.getElementById('dialog-box');
		var wrapper = document.getElementById('wrapper');
		var body = document.body;

		m.DomContains(body, mask) && document.body.removeChild(mask);
		m.DomContains(body, dialog) && dialog.parentNode.removeChild(dialog);
		wrapper.classList.remove('filter');
	}

	/**
	 * 会话框html
	 * @param  {string} type  会话框样式
	 * @param  {function} inner 会话框主体内容
	 * @param  {string} title 会话框标题
	 * @return {string}      会话框html
	 */
	function tDialog(type, inner, title) {
		return [
			'<div class="'+ type +'" id="dialog-box">',
				'<i class="dialog-close"></i>',
				title ? ('<h2 class="dialog-title">'+ title +'</h2>') : '',
				'<div class="dialog-main">',
				inner(),
				'</div>',
			'</div>'
		].join("");
	}

	//预览
	function tQrcode() {
		return [
			'<h2 class="dialog-code-title">请用手机扫描二维码浏览</h2>',
			'<div class="dialog-code"></div>',
			'<div class="dialog-btn-wrap">',
				'<button class="btn-save" data-action="save">保存</button>',
				'<button class="btn-enabled" data-action="enabled">保存并启用</button>',
			'</div>'
		].join("");
	}

	//保存
	function tSave() {
		//获取页面设置模板
		var tSetting = new Setting.Templates({
			data: param.data
		});
		var html = tSetting.getPageName();
		//返回会话框主体内容html
		return [
			html,
			'<div class="dialog-btn-wrap">',
				'<button class="btn-'+ param.type +'" data-action="last-'+ param.type +'">'+ param.btnText +'</button>',
				'<button class="btn-cancel">取消</button>',
			'</div>'
		].join("");
	}

	//提示信息
	function tMessage() {
		return [
			'<i class="'+ (param.status == 1 ? 'message-success' : 'message-error') +'"></i>',
			'<span class="message-text">'+ param.text +'</span>'
		].join("");
	}

	//loading
	function tLoading() {
		return [
			'<i class="loading"></i>',
			'<span class="text">'+ param.content +'</span>'
		].join("");
	}

	exports.dialog = dialog;
	exports.message = message;
	exports.closeAll = closeAll;
});