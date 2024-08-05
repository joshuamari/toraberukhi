<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
require_once '../dbconn/dbconnectnew.php';
require_once '../global/globalFunctions.php';
#endregion



#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$msg = array();

#initialize Session
session_start();

#input checking region
if (!empty($_SESSION["IDKHI"])) {
  $userID = $_SESSION["IDKHI"];
  $userID = hex2bin($userID);
  $userID = base64_decode(urldecode($userID));
}

$empNumber = NULL;
if (!empty($_POST['empID'])) {
  $empNumber = $_POST['empID'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Employee Number";
}

$locID = 0;
if (!empty($_POST['locID'])) {
  $locID = $_POST['locID'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Location";
}

$spec_loc = '';
if (!empty($_POST['spec_loc'])) {
  $spec_loc = $_POST['spec_loc'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Specific Location";
}

$dateFrom = date("Y-m-d");
if (!empty($_POST['dateFrom'])) {
  $dateFrom = $_POST['dateFrom'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Date From";
}

$dateTo = date("Y-m-d");
if (!empty($_POST['dateTo'])) {
  $dateTo = $_POST['dateTo'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Date To";
}

$inviID = 0;
if (!empty($_POST['inviID'])) {
  $inviID = $_POST['inviID'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Invitation Type";
}

$workOrder = '';
if (!empty($_POST['workOrder'])) {
  $workOrder = $_POST['workOrder'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Work Order";
}

$project_name = '';
if (!empty($_POST['project_name'])) {
  $project_name = $_POST['project_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Project Name";
}
$site_dispatch = FALSE;
if (!empty($_POST['site_dispatch'])) {
  $site_dispatch = json_decode($_POST['site_dispatch']);
}

$allowance = 0;
if (!empty($_POST['allowance'])) {
  $allowance = $_POST['allowance'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Allowance";
}

$request_dept = '';
if (!empty($_POST['request_dept'])) {
  $request_dept = $_POST['request_dept'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Requesting Department";
}

// $request_name = '';
// if (!empty($_POST['request_name'])) {
//   $request_name = $_POST['request_name'];
// } else {
//   $msg["isSuccess"] = false;
//   $msg['error'][] = "Requester";
// }

#for separtion of error
if (!empty($msg)) {
  if (count($msg['error']) > 1) {
    $errorString = '';
    foreach ($msg['error'] as $result) {
      if ($result === end($msg['error'])) {
        $errorString .= "and '$result' Missing";
      } else {
        $errorString .= "'$result', ";
      }
    }
    $msg['error'] = $errorString;
  } else {
    $msg['error'] = implode("", $msg['error']);
    $msg['error'] .= " Missing";
  }
  die(json_encode($msg));
}
#endregion

# for conflicting schedule in dispatch list
$newRange = [
  'start' => $dateFrom,
  'end' => $dateTo,
];
if (checkOverlap($empNumber, $newRange)) {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Dispatch Conflict";
  die(json_encode($msg));
}
#endregion

# for conflicting schedule in request list
$checkConflict = "SELECT COUNT(*) FROM `request_list` WHERE `emp_number` = :empNumber AND ((`dispatch_from` BETWEEN :dateFrom AND :dateTo OR `dispatch_to` BETWEEN :dateFrom AND :dateTo) OR (:dateFrom BETWEEN `dispatch_from` AND `dispatch_to` OR :dateTo BETWEEN `dispatch_from` AND `dispatch_to`))";
$checkConflictStmt = $connpcs->prepare($checkConflict);
$checkConflictStmt->execute([":empNumber" => "$empNumber", ":dateFrom" => "$dateFrom", ":dateTo" => "$dateTo"]);
$checkCount = $checkConflictStmt->fetchColumn();
if ($checkCount > 0) {
  $msg["isSuccess"] = false;
  $msg['error'] = "Dispatch request conflict";
  die(json_encode($msg));
}
#endregion

#region Entries Query
try {
  $insertQ = "INSERT INTO `request_list`(`requester_id`,
                                          `emp_number`, 
                                          `location_id`, 
                                          `specific_loc`, 
                                          `dispatch_from`, 
                                          `dispatch_to`, 
                                          `invitation_id`, 
                                          `work_order`, 
                                          `project_name`, 
                                          `site_dispatch`, 
                                          `allowance`, 
                                          `request_by_dept`) 
              VALUES (:userID,
                      :empNumber,
                      :locID,
                      :spec_loc,
                      :dateFrom,
                      :dateTo,
                      :inviID,
                      :workOrder,
                      :project_name,
                      :site_dispatch,
                      :allowance,
                      :request_dept)";
  $insertStmt = $connpcs->prepare($insertQ);
  $insertStmt->execute([
    ":userID" => $userID,
    ":empNumber" => $empNumber,
    ":locID" => $locID,
    ":spec_loc" => $spec_loc,
    ":dateFrom" => $dateFrom,
    ":dateTo" => $dateTo,
    ":inviID" => $inviID,
    ":workOrder" => $workOrder,
    ":project_name" => $project_name,
    ":site_dispatch" => $site_dispatch,
    ":allowance" => $allowance,
    ":request_dept" => $request_dept
    // ":request_name" => $request_name
  ]);

  if ($insertStmt->rowCount() > 0) {
    $id = $connpcs->lastInsertId();
    $details = getRequestDetails($id);
    if (emailRequest($details)) {
      $msg["isSuccess"] = true;
      $msg["error"] = "Adding Work History successfully";
    }
  } else {
    $msg["isSuccess"] = false;
    $msg["error"] = "Adding Work History unsuccessful";
  }
} catch (Exception $e) {
  $msg["isSuccess"] = false;
  $msg['error'] =  "Connection failed: " . $e->getMessage();
}

echo json_encode($msg);
#endregion