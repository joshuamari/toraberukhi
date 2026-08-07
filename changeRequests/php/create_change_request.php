<?php
#region Headers
header('Content-Type: application/json');
#endregion

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
    "data" => [],
];
$userID = getID();
$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = $_POST;
}
if (!is_array($data)) {
    $data = [];
}

$changeType = strtolower(trim((string)(
    $data['change_type']
    ?? $data['requestType']
    ?? ''
)));
$requestId = (int)(
    $data['request_id']
    ?? $data['dispatchRequestId']
    ?? 0
);
$reason = trim((string)($data['reason'] ?? ''));
$proposedStart = substr(trim((string)(
    $data['proposedStartDate']
    ?? $data['requested_start_date']
    ?? ''
)), 0, 10);
$proposedEnd = substr(trim((string)(
    $data['proposedEndDate']
    ?? $data['requested_end_date']
    ?? ''
)), 0, 10);
$currentDatetime = date("Y-m-d H:i:s");
#endregion

#region validations
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['message'] = 'Method not allowed';
    die(json_encode($result));
}
if ($userID === 0) {
    $result["message"] = "Not logged in";
    die(json_encode($result));
}
if ($requestId <= 0) {
    $result["message"] = "Invalid request ID";
    die(json_encode($result));
}
if ($changeType !== 'date_change' && $changeType !== 'cancellation') {
    $result["message"] = "Invalid change request type";
    die(json_encode($result));
}
if ($reason === '') {
    $result["message"] = "Reason is required";
    die(json_encode($result));
}
if ($changeType === 'date_change') {
    if ($proposedStart === '' || $proposedEnd === '') {
        $result["message"] = "Proposed start and end dates are required";
        die(json_encode($result));
    }
    if ($proposedStart > $proposedEnd) {
        $result["message"] = "Proposed end date must be on or after the proposed start date";
        die(json_encode($result));
    }
}
#endregion

#region main function
try {
    $members = getMembers($userID);

    $requestQ = "SELECT
            `rl`.request_id,
            `rl`.requester_id,
            `rl`.emp_number,
            `rl`.location_id,
            `rl`.request_status,
            `rl`.dispatch_from,
            `rl`.dispatch_to,
            `rl`.dept_id,
            `rl`.date_requested
        FROM `request_list` rl
        WHERE `rl`.request_id = :request_id
        LIMIT 1";
    $requestStmt = $connpcs->prepare($requestQ);
    $requestStmt->execute([":request_id" => $requestId]);

    if ($requestStmt->rowCount() < 1) {
        $result["message"] = "Dispatch request not found";
        die(json_encode($result));
    }

    $request = $requestStmt->fetch(PDO::FETCH_ASSOC);
    $empNumber = (string)$request['emp_number'];

    if (count($members) > 0 && !in_array($empNumber, array_map('strval', $members), true)) {
        $result["message"] = "Not authorized";
        die(json_encode($result));
    }

    if ((int)$request['request_status'] !== 1) {
        $result["message"] = "Only approved dispatch requests can receive change requests";
        die(json_encode($result));
    }

    $dispatchTo = substr((string)$request['dispatch_to'], 0, 10);
    $today = date('Y-m-d');
    if ($dispatchTo !== '' && $dispatchTo < $today) {
        $result["message"] = "Change requests are not allowed for completed dispatches";
        die(json_encode($result));
    }

    $pendingQ = "SELECT change_request_id
        FROM `request_change_list`
        WHERE `request_id` = :request_id
          AND LOWER(`status`) = 'pending'
        LIMIT 1";
    $pendingStmt = $connpcs->prepare($pendingQ);
    $pendingStmt->execute([
        ":request_id" => $requestId,
    ]);

    if ($pendingStmt->rowCount() > 0) {
        $result["message"] = "A pending change request already exists for this dispatch";
        die(json_encode($result));
    }

    $originalStart = substr((string)$request['dispatch_from'], 0, 10);
    $originalEnd = substr((string)$request['dispatch_to'], 0, 10);

    if ($changeType === 'date_change') {
        if ($proposedStart === $originalStart && $proposedEnd === $originalEnd) {
            $result["message"] = "Proposed dates must differ from the current dispatch dates";
            die(json_encode($result));
        }
    }

    $requestedStart = $changeType === 'date_change' ? $proposedStart : null;
    $requestedEnd = $changeType === 'date_change' ? $proposedEnd : null;

    $insertQ = "INSERT INTO `request_change_list` (
            `request_id`,
            `change_type`,
            `status`,
            `original_start_date`,
            `original_end_date`,
            `requested_start_date`,
            `requested_end_date`,
            `reason`,
            `requested_by`,
            `requested_at`,
            `date_modified`
        ) VALUES (
            :request_id,
            :change_type,
            'pending',
            :original_start_date,
            :original_end_date,
            :requested_start_date,
            :requested_end_date,
            :reason,
            :requested_by,
            :requested_at,
            NULL
        )";
    $insertStmt = $connpcs->prepare($insertQ);
    $insertStmt->execute([
        ":request_id" => $requestId,
        ":change_type" => $changeType,
        ":original_start_date" => $originalStart,
        ":original_end_date" => $originalEnd,
        ":requested_start_date" => $requestedStart,
        ":requested_end_date" => $requestedEnd,
        ":reason" => $reason,
        ":requested_by" => (int)$userID,
        ":requested_at" => $currentDatetime,
    ]);

    $changeRequestId = (int)$connpcs->lastInsertId();
    $year = date('Y', strtotime($currentDatetime) ?: time());
    $paddedId = str_pad((string)$changeRequestId, 3, '0', STR_PAD_LEFT);
    $prefix = $changeType === 'cancellation' ? 'CR' : 'DCR';
    $displayId = "{$prefix}-{$year}-{$paddedId}";

    $details = getRequestDetails($requestId);
    $changeData = [
        "original_start_date" => $originalStart,
        "original_end_date" => $originalEnd,
        "requested_start_date" => $requestedStart,
        "requested_end_date" => $requestedEnd,
        "reason" => $reason,
    ];

    if ($changeType === 'date_change') {
        emailDateChangeRequest($details, $changeData);
        $successMessage = "Date change request submitted successfully";
    } else {
        emailCancellationRequest($details, $changeData);
        $successMessage = "Cancellation request submitted successfully";
    }

    $result["isSuccess"] = true;
    $result["message"] = $successMessage;
    $result["data"] = [
        "change_request_id" => $changeRequestId,
        "request_id" => $requestId,
        "change_type" => $changeType,
        "status" => "pending",
        "display_id" => $displayId,
    ];
} catch (Exception $e) {
    $result["isSuccess"] = false;
    $result["message"] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
