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

//36 is access ID
//37 is modify ID
#region main function
try {
    $empQ = "SELECT kd.`number` as `id`, kd.`surname`, kd.`firstname`, gl.`name` as `group` FROM `khi_details` as kd LEFT JOIN kdtphdb_new.`group_list` as gl 
    ON gl.`id` = kd.`group_id` WHERE `number` = :userID AND `is_active`=1";
    $empStmt = $connpcs->prepare($empQ);
    $empStmt->execute([":userID" => "$userID"]);
    if ($empStmt->rowCount() > 0) {
        $empDetails = $empStmt->fetchObject();
        $checkAccess = allGroupAccess($userID);
        if ($checkAccess == true) {
            $empDetails->type = 1;
        } else {
            $empDetails->type = 0;
        }

        $result["isSuccess"] = true;
        $result["data"] = $empDetails;
    } else {
        $result["isSuccess"] = false;
        $result["message"] = "User not found";
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
