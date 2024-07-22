<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$msg = array();
$work_histID =  $empNumber = 0; 
$date_yearStart = $date_monthStart = $date_yearEnd = $date_monthEnd = $comp_name = $comp_business = $busi_content = $work_loc = NULL;
#end region

#region get values
if (!empty($_POST['work_histID'])) {
	$work_histID = $_POST['work_histID'];
}

if (!empty($_POST['empID'])) {
	$empNumber = $_POST['empID'];
}

if (!empty($_POST['date_yearStart'])) {
	$date_yearStart = $_POST['date_yearStart'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Start 'Year' is Missing";
}

if (!empty($_POST['date_monthStart'])) {
	$date_monthStart = sprintf('%02d', $_POST['date_monthStart']);
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Start 'Month' is Missing";
}

if (!empty($_POST['date_yearEnd'])) {
	$date_yearEnd = $_POST['date_yearEnd'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "End 'Year' is Missing";
}

if (!empty($_POST['date_monthEnd'])) {
	$date_monthEnd = sprintf('%02d', $_POST['date_monthEnd']);
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "End 'Month' is Missing";
}

if (!empty($_POST['comp_name'])) {
	$comp_name = $_POST['comp_name'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Name is Missing";
}

if (!empty($_POST['comp_business'])) {
	$comp_business = $_POST['comp_business'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Business is Missing";
}

if (!empty($_POST['business_cont'])) {
	$busi_content = $_POST['business_cont'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Business Content is Missing";
}

if (!empty($_POST['work_loc'])) {
	$work_loc = $_POST['work_loc'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Work Location is Missing";
}

if (!empty($msg)) {
	$msg['error'] = implode(", ", $msg['error']);
	die(json_encode($msg));
}
#end region

#setting up dates
$date_Start = date($date_yearStart . "-" . $date_monthStart . "-01");
$date_End = date($date_yearEnd . "-" . $date_monthEnd . "-01");
#end region

#region Entries Query
try {
	$updateQ = "UPDATE `work_history` SET `emp_id` = :empNumber, 
                                        `start_date` = :date_Start, 
																				`end_date` = :date_End, 
																				 `comp_name` = :comp_name, 
																				 `comp_business` = :comp_business, 
																				 `business_cont` = :busi_content, 
																				 `work_loc` = :work_loc
                                    WHERE work_hist_id = :wh_id";

	$updateStmt = $connpcs->prepare($updateQ);
	if($updateStmt->execute([":empNumber" => $empNumber, ":date_Start" => $date_Start, ":date_End" => $date_End, ":comp_name" => $comp_name,
											     ":comp_business" => $comp_business, ":busi_content" => $busi_content, ":work_loc" => $work_loc, ":wh_id" => $work_histID])) {
    $msg["isSuccess"] = true;
    $msg["error"] = "Update successful";
  }
  else {
    $msg["isSuccess"] = false;
    $msg["error"] = "Error updating";
  }
} catch (Exception $e) {
  echo "Connection failed: " . $e->getMessage();
}
#end region

echo json_encode($msg);