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
    $getQ = "SELECT `rl`.*,`rd`.department_name FROM `request_list` rl JOIN `requesters_dep` rd ON `rl`.dept_id = `rd`.id WHERE `request_id`=:request_id";
    $getStmt = $connpcs->prepare($getQ);
    $getStmt->execute([":request_id" => $requestID]);
    if ($getStmt->rowCount() > 0) {
        $details = $getStmt->fetch();
        $details['emp_name'] = getName($details['emp_number']);
        // $details['requester_name'] = getName($details['requester_id']);
        $details['request_dept'] = $details['department_name'];
        $details['start'] = date("d M Y", strtotime($details['dispatch_from']));
        $details['end'] = date("d M Y", strtotime($details['dispatch_to']));
        $details['date_request'] = date("d M Y", strtotime($details['date_requested']));
        $details['dh_date'] = date("F d, Y", strtotime($details['date_requested']));
        $details['location'] = getLocationName($details['location_id']);
        $details['location_id'] = (int)$details['location_id'];
        $details['invitation_id'] = (int)$details['invitation_id'];
        $details['site_dispatch'] = (int)$details['site_dispatch'];
        $details['allowance'] = getAllowance($details['emp_number']);
        $details['business'] = $details['work_content'];
        $details['gap_name'] =  $details['gap_name'];
        $details['cdcp_name'] =  $details['cdcp_name'];
        $details['gap_tel'] = $details['gap_tel'];
        $details['cdcp_tel'] = $details['cdcp_tel'];
        $details['dic_tel'] = "℡ " . $details['dic_tel'];
        $compID = getCompanyByDept($details['dept_id']);
        $compDetails = getCompanyDetails($compID);
        $details['company_jap'] = $compDetails['company_jap'];
        $details['company_desc'] = $compDetails['company_desc'];
        $result['isSuccess'] = TRUE;
        $result['message'] = 'Successfully fetched data';
        $result['data']['dispatch_request'] = $details;
        $result['data']['work_history'] = getWorkHistory($details['emp_number']);
    } else {
        $result['message'] = '0 results';
    }
} catch (PDOException $e) {
    $result['isSuccess'] = FALSE;
    $result['message'] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
