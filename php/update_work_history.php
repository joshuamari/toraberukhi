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
$date_monthYearStart = $date_yearEnd = $comp_name = $comp_business = $busi_content = $work_loc = NULL;
#end region

#region get values
if (!empty($_POST['work_histID'])) {
	$work_histID = $_POST['work_histID'];
}

if (!empty($_POST['date_monthYearStart'])) {
	$date_monthYearStart = $_POST['date_monthYearStart'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Start Month and Year";
}

$date_End = NULL;
if (!empty($_POST['date_monthYearEnd'])) {
	$date_monthYearEnd = $_POST['date_monthYearEnd'];
	$date_End = date($date_monthYearEnd . "-01");
}

if (!empty($_POST['comp_name'])) {
	$comp_name = $_POST['comp_name'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Name";
}

if (!empty($_POST['comp_business'])) {
	$comp_business = $_POST['comp_business'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Company Business";
}

if (!empty($_POST['business_cont'])) {
	$busi_content = $_POST['business_cont'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Business Content";
}

if (!empty($_POST['work_loc'])) {
	$work_loc = $_POST['work_loc'];
} else {
	$msg["isSuccess"] = false;
	$msg['error'][] = "Work Location";
}

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
#end region

#setting up dates
$date_Start = date($date_monthYearStart . "-01");
#end region

#region Entries Query
try {
	$updateQ = "UPDATE `work_history` SET `start_date` = :date_Start, 
																				`end_date` = :date_End, 
																				 `comp_name` = :comp_name, 
																				 `comp_business` = :comp_business, 
																				 `business_cont` = :busi_content, 
																				 `work_loc` = :work_loc
                                    WHERE `work_hist_id` = :wh_id";

	$updateStmt = $connpcs->prepare($updateQ);
	$updateStmt->execute([
		":date_Start" => $date_Start, ":date_End" => $date_End, ":comp_name" => $comp_name,
		":comp_business" => $comp_business, ":busi_content" => $busi_content, ":work_loc" => $work_loc, ":wh_id" => $work_histID
	]);
	if ($updateStmt->rowCount() > 0) {
		$msg["isSuccess"] = true;
		$msg["error"] = "Update successful";
	} else {
		$msg["isSuccess"] = false;
		$msg["error"] = "No changes has been made";
	}
} catch (Exception $e) {
	echo "Connection failed: " . $e->getMessage();
}
#end region

echo json_encode($msg);
