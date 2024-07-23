<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$empNum = 0;
#endregion

#region get values
if (!empty($_POST["empID"])) {
  $empNum = $_POST["empID"];
} else {
  $msg["isSuccess"] = false;
	$msg['error'] = "Employee Number Missing";
  die(json_encode($msg));
}

try {
  $getQ = "SELECT work_hist_id as id, MONTH(start_date) as start_month, YEAR(start_date) as start_year, MONTH(end_date) as end_month, YEAR(end_date) as end_year, comp_name, comp_business, business_cont, work_loc 
           FROM `work_history`
           WHERE emp_id = :empNum";
  $getStmt = $connpcs->prepare($getQ);
  $getStmt->execute([":empNum" => $empNum]);
  if($getStmt->rowCount() > 0) {
    $result = $getStmt->fetchAll();
    $msg['result'] = $result;
    $msg["isSuccess"] = true;
    $msg["error"] = "Successfully retieve the data";
  }
  else {
    $msg["isSuccess"] = false;
    $msg["error"] = "Employee No." . $empNum . " has no data to retrieve";
  }
} catch (Exception $e) {
  $msg['isSuccess'] = false;
  $msg['error'] = "Failed to retrieve the data" . $e->getMessage();
}

echo json_encode($msg);