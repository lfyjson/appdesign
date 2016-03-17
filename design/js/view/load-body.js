define(function (require, exports, module) {
	var widgets = [
		{
			type: 'text',
			name: '单行输入框'
		},
		{
			type: 'textarea',
			name: '多行输入框'
		},
		{
			type: 'number',
			name: '数字输入框'
		},
		{
			type: 'radio',
			name: '单选框'
		},
		{
			type: 'date',
			name: '日期'
		},
		{
			type: 'dateRange',
			name: '日期区间'
		},
		{
			type: 'image',
			name: '图片'
		},
		{
			type: 'detail',
			name: '明细'
		}
	];

	var tpls = [
		{
			path: 'default',
			name: '最近一次保存的'	
		},
		{
			path: '.tpl/empty',
			name: '空模板'
		},
		{
			path: '.tpl/conversion',
			name: '转正申请'
		},
		{
			path: '.tpl/seal',
			name: '用印盖章'
		},
		{
			path: '.tpl/consuming',
			name: '物品领用'
		},
		{
			path: '.tpl/dimission',
			name: '离职'
		},
		{
			path: '.tpl/evection',
			name: '出差'
		},
		{
			path: '.tpl/gotout',
			name: '外出'
		},
		{
			path: '.tpl/overtime',
			name: '加班'
		},
		{
			path: '.tpl/payment',
			name: '支付'
		},
		{
			path: '.tpl/recruit',
			name: '招聘'
		},
		{
			path: '.tpl/reimburse',
			name: '报销'
		},
		{
			path: '.tpl/leave',
			name: '请假'
		},
		{
			path: '.tpl/123456789',
			name: '加载失败'
		}
	];

	/**
	 * 控件样本
	 * @param  {Array} widgets 控件集合
	 * @return {string}         控件DOM
	 */
	function tWidget() {
		var html = '<div class="controls" name="tpl-main">';
		widgets.forEach(function (obj) {
			html += '<span class="control-item" name="control" data-type="'+ obj.type +'">'+ obj.name +'<i class="i-'+ obj.type +'"></i></span>'
		});
		html += '</div>';
		return html;
	}

	//占位符
	function tPlaceholder() {
		return '<div name="phone-item" data-role="placeholder"></div>';
	}

	/**
	 * 云模板
	 * @return {String} html
	 */
	function tTpl() {
	var html = '<div class="templates" name="tpl-main" id="tpl-wrap">';
		tpls.forEach(function (obj) {
			html += '<a href="#'+ obj.path +'" class="tpl-item" data-name="tpl">' + obj.name + '</a>';
		});
		html += '</div>';
		return html;
	}

	/**
	 * 获取模板名
	 * @return {String} 模板名
	 */	
	function getTplName(path) {
		var name;
		tpls.forEach(function (obj) {
			if(obj.path == path) {
				name = obj.name;
				return;
			}
		});
		return name;
	}
	
	var html = [
		'<section id="wrapper">',
			'<header class="header">',
				'<h1 class="header-title">审批设计器</h1>',
				'<div class="header-actions" id="header-actions">',
					'<button class="btn-preview" id="preview">预览</button>',
					'<button class="btn-save" data-action="save">保存</button>',
					'<button class="btn-enabled" data-action="enabled">保存并启用</button>',
				'</div>',
			'</header>',

			'<section class="main">',
				'<section class="control-wrap" id="controls">',
					'<div>',
						'<a href="javascript:void(0)" class="op-title active">控件</a>',
						'<a href="javascript:void(0)" class="op-title">云模板</a>',
					'</div>',
					tWidget(widgets),
				'</section>',
				'<section class="phone-wrap">',
					'<div class="phone-inner" id="phone-inner">',
						'<div class="phone-body" id="phone-body">',
							tPlaceholder(),
						'</div>',
						'<div class="phone-tpl-prompt"><span></span></div>',
					'</div>',
				'</section>',
				'<aside class="setting-wrap" id="setting-wrap">',
					'<div class="setting-tab" id="setting-tab">',
						'<a href="javascript:void(0)" class="op-title">控件设置</a>',
						'<a href="javascript:void(0)" class="op-title active">审批设置</a>',
					'</div>',
				'</aside>',
			'</section>',
		'</section>'
	].join("");

	document.body.innerHTML += html;

	exports.tPlaceholder = tPlaceholder;
	exports.tWidget = tWidget;
	exports.tTpl = tTpl;
	exports.getTplName = getTplName;
});