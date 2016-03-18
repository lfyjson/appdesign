<?php
header('Content-type: text/html;chartset=utf-8');
sleep(2);
//mobile表单提交处理
//接收数据格式
//userId=xxx&formId=xxx&data={xxx}....
//
//参数说明
//data= {xxx} json键值对

//返回值
//成功返回{status: 200}
//失败返回{status: 0}

// foreach($_POST as $key => $value) {
// 	echo $key.':'.$value.' | ';
// }
$data = $_POST['data'];
// file_put_contents('test.js', $data);

$arr = Array('status' => 200);
echo json_encode($arr);

