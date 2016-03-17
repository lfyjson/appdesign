define(function (require, exports, module) {
	var browers = [
		{
			name: 'Chrome',
			link: 'https://www.google.com/chrome/',
			src: 'design/images/brower/chrome.png'
		},
		{
			name: 'Safari',
			link: 'https://www.apple.com/cn/safari/',
			src: 'design/images/brower/safari.png'
		},
		{
			name: 'Firefox',
			link: 'https://www.mozilla.org/zh-CN/firefox/new/',
			src: 'design/images/brower/firefox.png'
		},
		{
			name: 'Internet Explorer 11',
			link: 'http://windows.microsoft.com/zh-cn/internet-explorer/ie-11-worldwide-languages',
			src: 'design/images/brower/ie.png'
		}
	];

	/**
	 * 创建浏览器标签
	 * @param  {Array} browers 浏览器集合
	 * @return {String}         浏览器DOM
	 */
	function createBrowers(browers) {
		var html = '';
		for(var i = 0; i < browers.length; i++) {
			html += [
				'<a href="'+ browers[i].link +'">',
					'<img src="'+ browers[i].src +'" alt="下载'+ browers[i].name +'浏览器" />',
					'<span>'+ browers[i].name +'</span>',
				'</a>'
			].join("");
		}
		return html;
	}

	var html = [
		'<div class="brower-wrapper">',
			'<h1>',
				'很抱歉您目前使用的浏览器无法完整支持审批设计器，<br />',
				'为了保证您的使用效果，请下载并安装以下任一最新版本的浏览器。',
			'</h1>',

			'<div class="brower-main">',
				createBrowers(browers),
			'</div>',
		'</div>'
	].join("");

	document.body.innerHTML += html;
});