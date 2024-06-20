<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$dispatchID = $empNum = $dispatchLoc = 0;
$dateFrom = $dateTo = NULL;
#endregion

#region get values
if (!empty($_POST["empID"])) {
    $empNum = $_POST["empID"];
}
if (!empty($_POST["dispatchID"])) {
    $dispatchID = $_POST["dispatchID"];
}
if (!empty($_POST["dateFrom"])) {
    $dateFrom = $_POST["dateFrom"];
}
if (!empty($_POST["dateTo"])) {
    $dateTo = $_POST["dateTo"];
}
if (!empty($_POST["locID"])) {
    $dispatchLoc = $_POST["locID"];
}
#endregion

#region main function
try {
    $range = [
        "start" => $dateFrom,
        "end" => $dateTo
    ];

    if (checkOverlap($range)) {
        $msg["isSuccess"] = false;
        $msg["error"] = "Dispatch conflict";
    } else {
        $updateQ = "UPDATE dispatch_list SET location_id = :dispatchLoc, dispatch_from = :dateFrom, dispatch_to = :dateTo WHERE dispatch_id = :dispatchID";
        $updateStmt = $connpcs->prepare($updateQ);
        if ($updateStmt->execute([":dispatchLoc" => "$dispatchLoc", ":dateFrom" => "$dateFrom", ":dateTo" => "$dateTo", ":dispatchID" => "$dispatchID"])) {
            $msg["isSuccess"] = true;
            $msg["error"] = "Update successfull";
        } else {
            $msg["isSuccess"] = false;
            $msg["error"] = "Error updating";
        }
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($msg);

#region function
function checkOverlap($range)
{
    global $connpcs, $empNum, $dispatchID;
    $isOverlap = false;
    $starttime = $range['start'];
    $endtime = $range['end'];
    $dispatchQ = "SELECT * FROM `dispatch_list` WHERE `emp_number` = :empNum AND `dispatch_id` != :dispatchID AND ((`dispatch_from` <= :starttime AND `dispatch_to` >= :starttime) OR 
    (`dispatch_from` <= :endtime AND `dispatch_to` >= :endtime) OR (:starttime <= `dispatch_from` AND :endtime >= `dispatch_from`) OR (:starttime <= `dispatch_to` AND :endtime >= `dispatch_to`))";
    $dispatchStmt = $connpcs->prepare($dispatchQ);
    $dispatchStmt->execute([":empNum" => $empNum, ":starttime" => $starttime, ":endtime" => $endtime, ":dispatchID" => $dispatchID]);
    if ($dispatchStmt->rowCount() > 0) {
        $isOverlap = true;
    }

    return $isOverlap;
}
#endregion