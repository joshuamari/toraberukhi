<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$msg = array();

$empNumber = NULL;
if (!empty($_POST['empID'])) {
    $empNumber = $_POST['empID'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Employee Number Missing";
}

$locID = 0;
if (!empty($_POST['locID'])) {
    $locID = $_POST['locID'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Location Missing";
}

$spec_loc = '';
if (!empty($_POST['spec_loc'])) {
    $spec_loc = $_POST['spec_loc'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Specific Location Missing";
}

$dateFrom = date("Y-m-d");
if (!empty($_POST['dateFrom'])) {
    $dateFrom = $_POST['dateFrom'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Date From Missing";
}

$dateTo = date("Y-m-d");
if (!empty($_POST['dateTo'])) {
    $dateTo = $_POST['dateTo'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Date To Missing";
}

$inviID = 0;
if (!empty($_POST['inviID'])) {
  $inviID = $_POST['inviID'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Invitation Type is Missing";
}

$workOrder = '';
if (!empty($_POST['workOrder'])) {
  $workOrder = $_POST['workOrder'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Word Order is Missing";
}

$project_name = '';
if (!empty($_POST['project_name'])) {
  $project_name = $_POST['project_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Project Name is Missing";
}
// die(json_encode((int) $_POST['site_dispatch']));
$site_dispatch = FALSE;
if (!empty($_POST['site_dispatch'])) {
  $site_dispatch = $_POST['site_dispatch'];
// } else {
//   $msg["isSuccess"] = false;
//   $msg['error'] = "Site Dispatch Checkbox is Missing";
}

$allowance = 0;
if (!empty($_POST['allowance'])) {
  $allowance = $_POST['allowance'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Allowance is Missing";
}

$request_dept = '';
if (!empty($_POST['request_dept'])) {
  $request_dept = $_POST['request_dept'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Requesting Department is Missing";
}

$request_name = '';
if (!empty($_POST['request_name'])) {
  $request_name = $_POST['request_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'] = "Requester is Missing";
}
#endregion

#region Entries Query
try {
    if (empty($msg)) {
        $insertQ = "INSERT INTO `request_list`(`emp_number`, 
                                               `location_id`, 
                                               `specific_loc`, 
                                               `dipsatch_from`, 
                                               `dispatch_to`, 
                                               `invitation_id`, 
                                               `work_order`, 
                                               `project_name`, 
                                               `site_dispatch`, 
                                               `allowance`, 
                                               `request_by_dept`, 
                                               `request_by_name`) 
                    VALUES (:empNumber,
                            :locID,
                            :spec_loc,
                            :dateFrom,
                            :dateTo,
                            :inviID,
                            :workOrder,
                            :project_name,
                            :site_dispatch,
                            :allowance,
                            :request_dept,
                            :request_name)";
        $insertStmt = $connpcs->prepare($insertQ);
        $insertStmt->execute([":empNumber" => $empNumber, 
                              ":locID" => $locID,
                              ":spec_loc" => $spec_loc,
                              ":dateFrom" => $dateFrom, 
                              ":dateTo" => $dateTo, 
                              ":inviID" => $inviID,
                              ":workOrder" => $workOrder,
                              ":project_name" => $project_name,
                              ":site_dispatch" => $site_dispatch,
                              ":allowance" => $allowance,
                              ":request_dept" => $request_dept,
                              ":request_name" => $request_name]);
        $msg["isSuccess"] = true;
        $msg["error"] = "Adding dispatch successfull";
    }
} catch (Exception $e) {
    $msg["isSuccess"] = false;
    $msg['error'] =  "Connection failed: " . $e->getMessage();
}

#endregion
// echo json_encode(array('errors' => $errorMsg), JSON_PRETTY_PRINT);
echo json_encode($msg);
