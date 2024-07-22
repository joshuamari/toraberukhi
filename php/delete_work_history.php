<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$msg = array();
$work_histID = 0;
#endregion

#region get values
if (!empty($_POST["work_histID"])) {
    $work_histID = $_POST["work_histID"];
} else {
    $msg['isSuccess'] = false;
    $msg['error'] = "No work history ID";
    die(json_encode($msg));
}
#endregion

#region main function
try {
    $deleteQ = "DELETE FROM work_history WHERE work_hist_id = :wh_id";
    $deleteStmt = $connpcs->prepare($deleteQ);
    if ($deleteStmt->execute([":wh_id" => "$work_histID"])) {
        $msg["isSuccess"] = true;
        $msg["error"] = "Successfully deleted";
    }
} catch (Exception $e) {
    $msg['isSuccess'] = false;
    $msg['error'] = "Failed to delete" . $e->getMessage();
}

echo json_encode($msg);
#endregion