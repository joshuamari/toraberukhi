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
$groups = 0;
#endregion

#region Initialize Variable
$emps = array();
$grpID = 0;
$userID = getID();

#endregion

if (!empty($_POST['grpID'])) {
    $grpID = $_POST['grpID'];
    $groups = $grpID;
}

#region main query
try {
    $empQ = "SELECT CONCAT(`surname`,', ',`firstname`) AS ename, `id` FROM `employee_list` WHERE `emp_status` = 1 AND `group_id` IN ($groups) GROUP BY `id` ORDER BY `surname`";
    // die($empQ);
    $empStmt = $connnew->query($empQ);

    if ($empStmt->rowCount() > 0) {
        $emparr = $empStmt->fetchAll();
        foreach ($emparr as $emp) {
            $output = array();
            $name = ucwords(strtolower($emp['ename']));
            $id = $emp['id'];
            $output += ["name" => $name];
            $output += ["id" => $id];
            array_push($emps, $output);
        }
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

#region FUNCTIONS

#endregion
echo json_encode($emps);
