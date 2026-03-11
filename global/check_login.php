<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
require_once '../dbconn/dbconnectkdtph.php';
require_once 'globalFunctions.php';
session_start();
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$userID = getID();
$empDetails = array();
$result = array();
#endregion

#region get data values
if (!empty($userID)) {
} else {
    $result["isSuccess"] = false;
    $result["message"] = "Not logged in";
    echo json_encode($result);
    die();
}
#endregion

#region main function
try {
    $empQ = "SELECT kd.`number` as `id`, kd.`surname`, kd.`firstname`, kd.`email`
             FROM `khi_details` as kd
             WHERE kd.`number` = :userID AND kd.`is_active` = 1";

    $empStmt = $connpcs->prepare($empQ);
    $empStmt->execute([":userID" => $userID]);

    if ($empStmt->rowCount() > 0) {
        $empDetails = $empStmt->fetchObject();

        $mainGroup = getKHIMainGroup($userID);
        $empDetails->group = $mainGroup ? $mainGroup["name"] : null;
        $empDetails->groupData = $mainGroup;
        $empDetails->groups = getKHIUserGroups($userID);

        $checkAccess = allGroupAccess($userID);
        $empDetails->type = $checkAccess ? 1 : 0;

        $result["isSuccess"] = true;
        $result["data"] = $empDetails;
    } else {
        $result["isSuccess"] = false;
        $result["message"] = "User not found";
    }
} catch (Exception $e) {
    $result["isSuccess"] = false;
    $result["message"] = $e->getMessage();
}
#endregion

echo json_encode($result);