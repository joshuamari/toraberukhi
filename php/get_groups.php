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
#endregion

#region Initialize Variable
if (!empty($_SESSION["IDKHI"])) {
    $userID = $_SESSION["IDKHI"];
    $userID = hex2bin($userID);
    $userID = base64_decode(urldecode($userID));
}
#endregion

#region main query
try {
    // $groups = getGroups($userID);


    // $groupQ = "SELECT group_id as id, group_name as name, group_abbr as abbreviation, (SELECT COUNT(*) FROM employee_details WHERE group_id = id) as empCount 
    // FROM group_list HAVING empCount > 0 ORDER BY group_name";
    // $groupStmt = $connpcs->query($groupQ);
    // $groupStmt->execute([]);
    // $groups = $groupStmt->fetchAll();
    $groups = getGroups($userID);
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion
echo json_encode($groups);
