<?php
header('Content-type: text/html;chartset=utf-8');

//设计器保存表单处理
//接收数据格式
//userId=xxx&formId=xxx&tplid=xiaoming/pvw/5642abe3.....
//参数说明
//tplid = data123456789.js 表单模板文件名
//
//返回值
//成功返回 
//{ status: 200, oldTemplate: data123456789.js} 
//oldTemplate为旧模板文件名
//
//失败返回 
//{ status: 0, text: '表单名重复' }
//text为失败原因

// foreach($_POST as $key => $value) {
// 	echo $key.':'.$value.' | ';
// }

$arr = Array('status' => 200, 'oldTemplate' => '.vs/pvw/5642abe3/data/5642abe3');

echo json_encode($arr);