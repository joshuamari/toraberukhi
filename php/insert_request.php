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
$result = [
  "isSuccess" => FALSE,
  "message" => ''
];
$required_fields = [
  'empID' => "Employee Number",
  'locID' => "Location",
  'spec_loc' => "Employee Number",
  'dateFrom' => "Date From",
  'dateTo' => "Date To",
  'inviID' => "Invitation Type",
  'workOrder' => "Work Order",
  'project_name' => "Project Name",
  'request_dept' => "Requesting Department",
  'business' => "Business Content",
  'req_name' => "Requester's Name",
  'req_tel' => "Requester's Telephone Number",
  'req_fax' => "Requester's Fax Number",
  'gap_name' => "General Affairs and Personal Group Personnel",
  'gap_tel' => "General Affairs and Personal Group Telephone Number",
  'cdcp_name' => "Control Dep't Corporate Planning Personnel",
  'cdcp_tel' => "Control Dep't Corporate Planning Telephone Number",
  'dept_in_charge' => "Department in Charge",
  'dic_name' => "Department in Charge Supervisor",
  'dic_tel' => "Department in Charge Telephone Number",
];
$input = $_POST;
$missing_fields = [];
#endregion
#initialize Session
session_start();

#region input checking region
if (!empty($_SESSION["IDKHI"])) {
  $userID = $_SESSION["IDKHI"];
  $userID = hex2bin($userID);
  $userID = base64_decode(urldecode($userID));
}
foreach ($required_fields as $key => $descrpition) {
  if (empty($input[$key])) {
    $missing_fields[] = $descrpition;
  }
}
$site_dispatch = FALSE;
if (!empty($input['site_dispatch'])) {
  $site_dispatch = json_decode($input['site_dispatch']);
}
$empNumber = $input['empID'];
$dateFrom = $input['dateFrom'];
$dateTo = $input['dateTo'];
#endregion
#region for separtion of error
$count = count($missing_fields);
if ($count > 0) {
  if ($count === 1) {
    $result['message'] = "{$missing_fields[0]} is missing.";
  } elseif ($count === 2) {
    $result['message'] = "{$missing_fields[0]} and {$missing_fields[1]} are missing.";
  } else {
    $last_field = array_pop($missing_fields);
    $result['message'] = implode(', ', $missing_fields) . ", and $last_field are missing.";
  }
  die(json_encode($result));
}
#endregion

#region checking for conflicting schedule in dispatch list
$newRange = [
  'start' => $dateFrom,
  'end' => $dateTo,
];
if (checkOverlap($empNumber, $newRange)) {
  $result["isSuccess"] = false;
  $result['message'] = "Dispatch Conflict";
  die(json_encode($result));
}
#endregion

#region for checking conflicting schedule in request list
$checkConflict = "SELECT COUNT(*) FROM `request_list` WHERE `emp_number` = :empNumber AND (((`dispatch_from` BETWEEN :dateFrom AND :dateTo OR `dispatch_to` BETWEEN :dateFrom AND :dateTo) OR (:dateFrom BETWEEN `dispatch_from` AND `dispatch_to` OR :dateTo BETWEEN `dispatch_from` AND `dispatch_to`)) AND `request_status` IS NULL)";
$checkConflictStmt = $connpcs->prepare($checkConflict);
$checkConflictStmt->execute([":empNumber" => "$empNumber", ":dateFrom" => "$dateFrom", ":dateTo" => "$dateTo"]);
$checkCount = $checkConflictStmt->fetchColumn();
if ($checkCount > 0) {
  $result["isSuccess"] = false;
  $result['message'] = "Dispatch request conflict";
  die(json_encode($result));
}
#endregion

#region insert request
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
    ":locID" => $input['locID'],
    ":spec_loc" => $input['spec_loc'],
    ":dateFrom" => $dateFrom,
    ":dateTo" => $dateTo,
    ":inviID" => $input['inviID'],
    ":workOrder" => $input['workOrder'],
    ":project_name" => $input['project_name'],
    ":site_dispatch" => $site_dispatch,
    ":request_dept" => $input['request_dept'],
    ":business" => $input['business'],
    ":req_name" => $input['req_name'],
    ":req_tel" => $input['req_tel'],
    ":req_fax" => $input['req_fax'],
    ":gap_name" => $input['gap_name'],
    ":gap_tel" => $input['gap_tel'],
    ":cdcp_name" => $input['cdcp_name'],
    ":cdcp_tel" => $input['cdcp_tel'],
    ":dept_in_charge" => $input['dept_in_charge'],
    ":dic_name" => $input['dic_name'],
    ":dic_tel" => $input['dic_tel']
  ]);

  if ($insertStmt->rowCount() > 0) {
    $id = $connpcs->lastInsertId();
    $details = getRequestDetails($id);
    if (true) {
      $result["isSuccess"] = true;
      $result["message"] = "Adding Dispatch Request successfully";
    }
  } else {
    $result["isSuccess"] = false;
    $result["message"] = "Adding Dispatch Request unsuccessful";
  }
} catch (Exception $e) {
  $result["isSuccess"] = false;
  $result['message'] =  "Connection failed: " . $e->getMessage();
}

echo json_encode($result);
#endregion