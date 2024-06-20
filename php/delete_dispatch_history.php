<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$msg = array();
$dispatchID = 0;
#endregion

#region get values
if (!empty($_POST["dispatchID"])) {
    $dispatchID = $_POST["dispatchID"];
} else {
    $msg['isSuccess'] = false;
    $msg['error'] = "No dispatch ID";
    die(json_encode($msg));
}
#endregion

#region main function
try {
    $deleteQ = "DELETE FROM dispatch_list WHERE dispatch_id = :dispatchID";
    $deleteStmt = $connpcs->prepare($deleteQ);
    if ($deleteStmt->execute([":dispatchID" => "$dispatchID"])) {
        $msg["isSuccess"] = true;
        $msg["error"] = "Successfully deleted";
    }
} catch (Exception $e) {
    $msg['isSuccess'] = false;
    $msg['error'] = "Failed to delete" . $e->getMessage();
    // echo "Connection failed: " . $e->getMessage();
}

echo json_encode($msg);
#endregion