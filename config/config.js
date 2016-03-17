define(function (require, exports, module) {

	var prefix = 'http://';
	if(window.location.host.indexOf('css.tianyuyun.cn') !== -1) {
		prefix += '116.211.105.45:20013';
	} else {
		prefix += '10.8.10.55:8080';
	}

	var Path = {
		//预览接口
		preview: 'php/preview.php',

		//保存模板数据接口
		template: 'php/template.php',
		
		//增加审批模板接口
		save: 'server/save.php',
		// save: prefix + '/friendcircle/audit/addtemplate',
		
		//mobile无刷新上传图片接口
		file: '../server/file.php',
		// file: prefix + '/friendcircle/audit/qfile',

		//mobile提交审批项接口
		submit: '../server/submit.php',
		// submit: prefix + '/friendcircle/audit/additem',

		//获取审批人列表接口
		'getApprover': prefix + '/friendcircle/audit/qteacher',
		
		//设计器模板数据js保存路径
		designDataPath: 'php/data/',

		//mobile模板数据js保存路径
		mobileDataPath: '../php/data/'
	}

	// a)http://10.8.10.55:8080/friendcircle/audit/addtemplate
	// -->增加审批模板接口
	// b)http://10.8.10.55:8080/friendcircle/audit/additem
	// -->增加审批项接口
	// c)http://10.8.10.55:8080/friendcircle/audit/qfile
	// -->上传图片接口 img和suffix
	// d)http://10.8.10.55:8080/friendcircle/audit/getauditors
	// -->获取审批人接口
	// e)http://10.8.10.55:8080/friendcircle/audit/addtemplate
	// -->编辑审批模板接口，此时要传入id，也就是说凡是传入id的 我都会认为是编辑的

	module.exports = {
		Path: Path
	}
});