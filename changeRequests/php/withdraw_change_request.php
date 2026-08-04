<?php
#region DB Connect
require_once __DIR__ . '/../../dbconn/dbconnectnew.php';
require_once __DIR__ . '/../../dbconn/dbconnectpcs.php';
require_once __DIR__ . '/../../dbconn/dbconnectkdtph.php';
require_once __DIR__ . '/../../global/globalFunctions.php';
#endregion

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$result = [
    "isSuccess" => false,
    "message" => "",
];
#endregion

#region get data values
$userID = getID();
if ($userID === 0) {
    $result["message"] = "Not logged in";
    die(json_encode($result));
}

$changeRequestId = 0;
if (!empty($_POST["change_request_id"])) {
    $changeRequestId = (int)$_POST["change_request_id"];
}

if ($changeRequestId <= 0) {
    $result["message"] = "Missing change request ID";
    die(json_encode($result));
}
#endregion

#region main function
try {
    $selectQ = "SELECT `change_request_id`, `status`, `requested_by`
        FROM `pcosdb`.request_change_list
        WHERE `change_request_id` = :changeRequestId
        LIMIT 1";
    $selectStmt = $connpcs->prepare($selectQ);
    $selectStmt->execute([":changeRequestId" => $changeRequestId]);

    if ($selectStmt->rowCount() === 0) {
        $result["message"] = "Change request not found";
        die(json_encode($result));
    }

    $row = $selectStmt->fetch(PDO::FETCH_ASSOC);
    $requestedBy = (int)$row["requested_by"];
    $status = strtolower(trim((string)$row["status"]));

    if ($requestedBy !== $userID) {
        $result["message"] = "Only the requester can withdraw this request";
        die(json_encode($result));
    }

    if ($status !== "pending") {
        $result["message"] = "Only pending requests can be withdrawn";
        die(json_encode($result));
    }

    $updateQ = "UPDATE `pcosdb`.request_change_list
        SET `status` = 'withdrawn',
            `date_modified` = NOW()
        WHERE `change_request_id` = :changeRequestId
          AND `requested_by` = :userID
          AND `status` = 'pending'";
    $updateStmt = $connpcs->prepare($updateQ);
    $updateStmt->execute([
        ":changeRequestId" => $changeRequestId,
        ":userID" => $userID,
    ]);

    if ($updateStmt->rowCount() > 0) {
        $result["isSuccess"] = true;
        $result["message"] = "Request withdrawn successfully";
    } else {
        $result["message"] = "Failed to withdraw request";
    }
} catch (Exception $e) {
    $result["isSuccess"] = false;
    $result["message"] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
