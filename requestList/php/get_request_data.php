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
$requestID = 0;
#endregion

#region validations
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $result['message'] = 'Method not allowed';
    die(json_encode($result));
}
if (!empty($_GET['request_id'])) {
    $requestID = html_entity_decode($_GET['request_id'], ENT_QUOTES, 'UTF-8');
} else {
    $result['message'] = 'Request ID cannot be empty';
    die(json_encode($result));
}
#endregion

#region main function
try {
    $getQ = "SELECT * FROM `request_list` WHERE `request_id`=:request_id";
    $getStmt = $connpcs->prepare($getQ);
    $getStmt->execute([":request_id" => $requestID]);
    if ($getStmt->rowCount() > 0) {
        $details = $getStmt->fetch();
        $details['emp_name'] = getName($details['emp_number']);
        $details['start'] = date("d M Y", strtotime($details['dispatch_from']));
        $details['end'] = date("d M Y", strtotime($details['dispatch_to']));
        $details['date_request'] = date("d M Y", strtotime($details['date_requested']));
        $result['isSuccess'] = TRUE;
        $result['message'] = 'Successfully fetched data';
        $result['data'] = $details;
    } else {
        $result['message'] = '0 results';
    }
} catch (PDOException $e) {
    $result['isSuccess'] = FALSE;
    $result['message'] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
