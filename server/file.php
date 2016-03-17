<?php
header('Content-type: text/html;chartset=utf-8');

//无刷新异步上传图片处理
//数据接收格式
//userId=xxx&formId=xxx&imgId=c22ded51&action=upload&thumb=base64...&natural=base64...
//参数说明：
//imgId = c22ded51 图片id
//action = upload 上传图片  
//action = delete 删除图片
//thumb = base64... 图片缩略图 base64编码
//natural = base64... 图片大图 base64编码
//
//返回值
//处理成功返回{ status: 200}
//处理失败返回{ status: 0}

$action = $_POST['action'];
if($action == 'upload') {
	//缩略图base64编码
	$thumb = $_POST['thumbbase64'];
	//大图base64编码
	$natural = $_POST['naturalbase64'];
	file_put_contents('1.txt', $natural);

	$arr = Array('status' => 200, 'thumb' => $thumb, 'natural' => $natural);

	echo json_encode($arr);

	$base64_body = substr(strstr($natural,','),1);
	$data= base64_decode($base64_body);
	file_put_contents('test.jpg',$data);
	 

} else if($action = 'delete') {
	$arr = Array('status' => 200);
	echo json_encode($arr);
}

