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

$request_dept = 0;
if (!empty($_POST['request_dept'])) {
  $request_dept = $_POST['request_dept'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Requesting Department";
}

$business = '';
if (!empty($_POST['business'])) {
  $business = $_POST['business'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Business Content";
}

$req_name = '';
if (!empty($_POST['req_name'])) {
  $req_name = $_POST['req_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Requester's Name";
}

$req_tel = '';
if (!empty($_POST['req_tel'])) {
  $req_tel = $_POST['req_tel'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Requester's Telephone Number";
}

$req_fax = '';
if (!empty($_POST['req_fax'])) {
  $req_fax = $_POST['req_fax'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Requester's Fax Number";
}

$gap_name = '';
if (!empty($_POST['gap_name'])) {
  $gap_name = $_POST['gap_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "General Affairs and Personal Group Personnel";
}

$gap_tel = '';
if (!empty($_POST['gap_tel'])) {
  $gap_tel = $_POST['gap_tel'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "General Affairs and Personal Group Telephone Number";
}

$cdcp_name = '';
if (!empty($_POST['cdcp_name'])) {
  $cdcp_name = $_POST['cdcp_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Control Dep't Corporate Planning Personnel";
}

$cdcp_tel = '';
if (!empty($_POST['cdcp_tel'])) {
  $cdcp_tel = $_POST['cdcp_tel'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Control Dep't Corporate Planning Telephone Number";
}

$dept_in_charge = '';
if (!empty($_POST['dept_in_charge'])) {
  $dept_in_charge = $_POST['dept_in_charge'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Department in Charge";
}

$dic_name = '';
if (!empty($_POST['dic_name'])) {
  $dic_name = $_POST['dic_name'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Department in Charge Supervisor";
}

$dic_tel = '';
if (!empty($_POST['dic_tel'])) {
  $dic_tel = $_POST['dic_tel'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Department in Charge Telephone Number";
}
$msg['error'] = array();
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
$checkConflict = "SELECT COUNT(*) FROM `request_list` WHERE `emp_number` = :empNumber AND (((`dispatch_from` BETWEEN :dateFrom AND :dateTo OR `dispatch_to` BETWEEN :dateFrom AND :dateTo) OR (:dateFrom BETWEEN `dispatch_from` AND `dispatch_to` OR :dateTo BETWEEN `dispatch_from` AND `dispatch_to`)) AND `request_status` IS NULL)";
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
                                          `dept_id`,
                                          `work_content`,
                                          `req_name`,
                                          `req_tel`,
                                          `req_fax`,
                                          `gap_name`,
                                          `gap_tel`,
                                          `cdcp_name`,
                                          `cdcp_tel`,
                                          `dept_in_charge`,
                                          `dic_name`,
                                          `dic_tel`) 
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
                      :request_dept,
                      :business,
                      :req_name,
                      :req_tel,
                      :req_fax,
                      :gap_name,
                      :gap_tel,
                      :cdcp_name,
                      :cdcp_tel,
                      :dept_in_charge,
                      :dic_name,
                      :dic_tel)";
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
    ":request_dept" => $request_dept,
    ":business" => $business,
    ":req_name" => $req_name,
    ":req_tel" => $req_tel,
    ":req_fax" => $req_fax,
    ":gap_name" => $gap_name,
    ":gap_tel" => $gap_tel,
    ":cdcp_name" => $cdcp_name,
    ":cdcp_tel" => $cdcp_tel,
    ":dept_in_charge" => $dept_in_charge,
    ":dic_name" => $dic_name,
    ":dic_tel" => $dic_tel
  ]);

  if ($insertStmt->rowCount() > 0) {
    $id = $connpcs->lastInsertId();
    $details = getRequestDetails($id);
    if (emailRequest($details)) {
      $msg["isSuccess"] = true;
      $msg["error"] = "Adding Dispatch Request successfully";
    }
  } else {
    $msg["isSuccess"] = false;
    $msg["error"] = "Adding Dispatch Request unsuccessful";
  }
} catch (Exception $e) {
  $msg["isSuccess"] = false;
  $msg['error'] =  "Connection failed: " . $e->getMessage();
}

echo json_encode($msg);
#endregion