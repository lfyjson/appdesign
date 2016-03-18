<?php
header('Content-type: text/html;chartset=utf-8');
error_reporting(E_ALL & ~E_NOTICE);

// sleep(1);

$data = $_POST['data'];
$orgid = $_POST['orgid'];
$urlprefix = $_POST['urlprefix'];


//数据文件夹路径
// $PATH = './data/';
$PATH = 'saestor://design/data/';

//修改云模板
$fileName = $_POST['fileName'];
if($fileName) {
	$datafile = $fileName.'.js';
	file_put_contents($PATH.$datafile, "loadWidget('".$data."')");
	echo '云模板更换成功';
	exit;
}

$time = dechex(time());

//文件路径
$datafile = $orgid.'/pvw/'.$time.'.js';


//判断文件夹是否存在
if(!is_dir($PATH.$orgid)) {
	$res = mkdir($PATH.$orgid);
	if(!$res) {
		echo 0;
		exit;
	}
}
if(!is_dir($PATH.$orgid.'/pvw')) {
	$res = mkdir($PATH.$orgid.'/pvw');
	if(!$res) {
		echo 0;
		exit;
	}
}

// 新建文件
file_put_contents($PATH.$datafile, "loadWidget('".$data."')");

//删除文件后缀
$dataFilePath = substr($datafile, 0, -3);

echo $urlprefix.'mobile/mobile.html?tplid='.$dataFilePath;

