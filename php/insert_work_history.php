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

$date_monthYear = date("Y");
if (!empty($_POST['date_monthYear'])) {
    $date_monthYear = $_POST['date_monthYear'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Starting  Missing";
}

$date_monthStart = date("m");
if (!empty($_POST['date_monthStart'])) {
    $date_monthStart = $_POST['date_monthStart'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Start Date Missing";
}

$dateEnd = date("Y-m-d");
if (!empty($_POST['dateEnd'])) {
    $dateEnd = $_POST['dateEnd'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Date To Missing";
}