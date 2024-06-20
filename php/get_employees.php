<?php
#region DB Connect
require_once '../dbconn/dbconnectnew.php';
require_once '../dbconn/dbconnectpcs.php';
require_once '../dbconn/dbconnectkdtph.php';
require_once '../global/globalFunctions.php';
session_start();
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
$groups = array();
$userID = 0;
$grpID = 0;
#endregion

#region Initialize Variable
if (!empty($_SESSION["IDKHI"])) {
    $userID = $_SESSION["IDKHI"];
    $userID = hex2bin($userID);
    $userID = base64_decode(urldecode($userID));
}
if (!empty($_POST['grpID'])) {
    $grpID = $_POST['grpID'];
}
#endregion

#region main query
try {
    $employees = getMembers($userID, $grpID);
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

#region FUNCTIONS

#endregion
echo json_encode($employees);
