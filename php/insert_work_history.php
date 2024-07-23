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
	$msg['error'][] = "Employee Number Missing";
}

if (!empty($_POST['date_monthYearStart'])) {
	$date_monthYearStart = $_POST['date_monthYearStart'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Start 'Month' and 'Year' is Missing";
}

if (!empty($_POST['date_monthYearEnd'])) {
	$date_monthYearEnd = $_POST['date_monthYearEnd'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "End 'Month' and 'Year' is Missing";
}

$comp_name = '';
if (!empty($_POST['comp_name'])) {
	$comp_name = $_POST['comp_name'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Name is Missing";
}

$comp_business = '';
if (!empty($_POST['comp_business'])) {
	$comp_business = $_POST['comp_business'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Business is Missing";
}

$busi_content = '';
if (!empty($_POST['business_cont'])) {
	$busi_content = $_POST['business_cont'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Business Content is Missing";
}

$work_loc = '';
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
$date_Start = date($date_monthYearStart . "-01");
$date_End = date($date_monthYearEnd . "-01");
#end region

#region Entries Query
try {
	$insertQ = "INSERT INTO `work_history`(`emp_id`, 
																				 `start_date`, 
																				 `end_date`, 
																				 `comp_name`, 
																				 `comp_business`, 
																				 `business_cont`, 
																				 `work_loc`) 
							VALUES (:empNumber,
											:date_Start,
											:date_End,
											:comp_name,
											:comp_business,
											:busi_content,
											:work_loc)";

	$insertStmt = $connpcs->prepare($insertQ);
	$insertStmt->execute([":empNumber" => $empNumber,
												":date_Start" => $date_Start,
												":date_End" => $date_End,
												":comp_name" => $comp_name,
												":comp_business" => $comp_business,
												":busi_content" => $busi_content,
												":work_loc" => $work_loc]);
	if ($insertStmt->rowCount() > 0) {
		$msg["isSuccess"] = true;
		$msg["error"] = "Adding Work History successfully";
	}
	else {
		$msg["isSuccess"] = false;
		$msg["error"] = "Adding Work History unsuccessful";
	}
} catch (Exception $e) {
	$msg["isSuccess"] = false;
	$msg['error'] =  "Connection failed: " . $e->getMessage();
}

echo json_encode($msg);