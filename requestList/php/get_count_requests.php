<?php
//headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

#region DB Connect
require_once '../../dbconn/dbconnectpcs.php';
require_once '../../dbconn/dbconnectnew.php';
require_once '../../global/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$result = [
    "isSuccess" => FALSE,
    "message" => "",
    "data" => array()
];
$userID = getID();
#endregion

#region validations
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $result['message'] = 'Method not allowed';
    die(json_encode($result));
}
#endregion

#region main function
try {
    $getQ = "SELECT COUNT(CASE WHEN `request_status` IS NULL THEN 1 END) as pending,COUNT(CASE WHEN `request_status` = 1 THEN 1 END) as accepted,COUNT(CASE WHEN `request_status`= 0 THEN 1 END) as cancelled,COUNT(CASE WHEN `request_status` IS NULL AND DATE(`date_requested`)= CURDATE() THEN 1 END) as todaytotal,COUNT(CASE WHEN `request_status` = 1 AND DATE(`date_requested`)= CURDATE() THEN 1 END) as todayaccept,COUNT(*) as total FROM `request_list`";
    $getStmt = $connpcs->query($getQ);
    if ($getStmt->rowCount() > 0) {
        $countArr = $getStmt->fetch();
        $result['isSuccess'] = TRUE;
        $result['data']['pending'] = $countArr['pending'];
        $result['data']['accepted'] = $countArr['accepted'];
        $result['data']['cancelled'] = $countArr['cancelled'];
        $result['data']['todaytotal'] = $countArr['todaytotal'];
        $result['data']['todayaccept'] = $countArr['todayaccept'];
        $result['data']['total'] = $countArr['total'];
    } else {
        $result['message'] = '0 results';
    }
} catch (PDOException $e) {
    $result['isSuccess'] = FALSE;
    $result['message'] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
