<?php
header('Content-type: text/html;chartset=utf-8');
// error_reporting(E_ALL & ~E_NOTICE);

$action = $_POST['action'];

if($action == 'create') {
	/**
	 * 创建模板
	 */
	
	$data = $_POST['data'];
	$orgid = $_POST['orgid'];

	//数据文件夹路径
	$PATH = './data/';

	$time = dechex(time());

	//文件路径
	$datafile = $orgid.'/data/'.$time.'.js';

	//判断文件夹是否存在
	if(!is_dir($PATH.$orgid)) {
		$res = mkdir($PATH.$orgid);
		if(!$res) {
			echo 0;
			exit;
		}
	}
	if(!is_dir($PATH.$orgid.'/data')) {
		$res = mkdir($PATH.$orgid.'/data');
		if(!$res) {
			echo 0;
			exit;
		}
	}

	//新建文件
	file_put_contents("./data/".$datafile, "loadWidget('".$data."')");

	//删除文件后缀
	$dataFilePath = substr($datafile, 0, -3);

	//输出路径
	echo $dataFilePath;

} else if($action == 'delete') {

	/**
	 * 删除模板
	 */
	
	$oldTemplate = $_POST['oldTemplate'];
	//删除文件
	$result = @unlink('./data/'.$oldTemplate.'.js');
	if($result) {
		echo '旧模板删除成功';
	} else {
		echo '旧模板删除失败';
	}
}

