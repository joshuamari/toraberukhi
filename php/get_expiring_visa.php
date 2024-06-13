<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
require_once '../dbconn/dbconnectnew.php';
require_once '../global/globalFunctions.php';
session_start();
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$expiringList = array();
if (!empty($_SESSION["IDKHI"])) {
    $userID = $_SESSION["IDKHI"];
    $userID = hex2bin($userID);
    $userID = base64_decode(urldecode($userID));
}
#endregion

#region Entries Query
try {
    $groups = getGroups($userID);
    $groups = array_column($groups, "id");
    $groups = implode(", ", $groups);

    $expireQ = "SELECT CONCAT(el.firstname,' ',el.surname) AS ename, TIMESTAMPDIFF(DAY, CURDATE(), vd.visa_expiry) AS expiring_in, el.id FROM `visa_details` AS vd JOIN 
    kdtphdb_new.employee_list AS el ON vd.emp_number = el.id WHERE el.group_id IN ($groups) AND vd.visa_expiry >= CURDATE() AND  vd.visa_expiry <= DATE_ADD(CURDATE(), INTERVAL 7 MONTH) AND (el.emp_status = 1 
    OR vd.visa_expiry < CURDATE()) ORDER BY CASE WHEN vd.visa_expiry >= CURDATE() THEN 1 ELSE vd.visa_expiry END";
    $expireStmt = $connpcs->prepare($expireQ);
    $expireStmt->execute();
    $expireArr = $expireStmt->fetchAll();
    foreach ($expireArr as $exp) {
        $output = array();
        $name = $exp['ename'];
        $id = $exp['id'];
        $until = (int)$exp['expiring_in'];
        if ($until < 0) {
            $until = 0;
        }
        $output["name"] = $name;
        $output["id"] = $id;
        $output["until"] = $until;
        array_push($expiringList, $output);
    }
} catch (Exception $e) {
    $errorMsg['catch'] =  "Connection failed: " . $e->getMessage();
}

#endregion
echo json_encode($expiringList, JSON_PRETTY_PRINT);
