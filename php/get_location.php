<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$locations = array();
#endregion

try {
    $locQ = "SELECT location_id as id, location_name as name FROM location_list";
    $locStmt = $connpcs->prepare($locQ);
    $locStmt->execute([]);
    $locations = $locStmt->fetchAll();
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}

echo json_encode($locations);
