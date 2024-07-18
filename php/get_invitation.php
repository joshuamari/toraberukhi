<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
// require_once './config.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$invitation = array();
#endregion

try {
    // $locQ = "SELECT location_id as id, location_name as name FROM location_list";
    $inviQ = "SELECT invitation_id as id, invitation_type as type FROM invitation_list";
    $inviStmt = $connpcs->prepare($inviQ);
    $inviStmt->execute([]);
    $invitation = $inviStmt->fetchAll();
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}

echo json_encode($invitation);