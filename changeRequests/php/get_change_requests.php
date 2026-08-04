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
    "data" => [
        "date_changes" => [],
        "cancellations" => [],
    ],
];
#endregion

#region get data values
$userID = getID();
if ($userID === 0) {
    $result["message"] = "Not logged in";
    die(json_encode($result));
}

$membersStatement = "";
$groupMembers = getMembers($userID);
if (count($groupMembers) > 0) {
    $implodeString = implode("','", array_values($groupMembers));
    $membersStatement = "AND `rl`.emp_number IN ('" . $implodeString . "')";
}
#endregion

#region helpers
function mapChangeRequestStatus(?string $status): string
{
    $normalized = strtolower(trim((string)$status));

    return match ($normalized) {
        "approved", "accepted" => "accepted",
        "declined", "rejected", "denied" => "rejected",
        "withdrawn" => "withdrawn",
        "pending" => "pending",
        default => $normalized !== "" ? $normalized : "pending",
    };
}

function formatNetChangeDays(int $currentDays, int $proposedDays): string
{
    $diff = $proposedDays - $currentDays;

    if ($diff === 0) {
        return "0 days";
    }

    if ($diff === 1) {
        return "+1 day";
    }

    if ($diff === -1) {
        return "-1 day";
    }

    if ($diff > 0) {
        return "+{$diff} days";
    }

    return "{$diff} days";
}

function formatChangeRequestDisplayId(string $changeType, int $changeRequestId, string $requestedAt): string
{
    $year = date("Y", strtotime($requestedAt));
    $paddedId = str_pad((string)$changeRequestId, 3, "0", STR_PAD_LEFT);
    $prefix = $changeType === "cancellation" ? "CR" : "DCR";

    return "{$prefix}-{$year}-{$paddedId}";
}
#endregion

#region main query
try {
    $query = "SELECT
            `rcl`.change_request_id,
            `rcl`.request_id,
            `rcl`.change_type,
            `rcl`.status,
            `rcl`.original_start_date,
            `rcl`.original_end_date,
            `rcl`.requested_start_date,
            `rcl`.requested_end_date,
            `rcl`.reason,
            `rcl`.requested_by,
            `rcl`.requested_at,
            `rl`.emp_number,
            `el`.group_id,
            `gl`.name AS group_name
        FROM `pcosdb`.request_change_list rcl
        INNER JOIN `pcosdb`.request_list rl
            ON `rl`.request_id = `rcl`.request_id
        LEFT JOIN `kdtphdb_new`.employee_list el
            ON `el`.id = `rl`.emp_number
        LEFT JOIN `kdtphdb_new`.group_list gl
            ON `gl`.id = `el`.group_id
        WHERE `rl`.emp_number != 0
        $membersStatement
        ORDER BY `rcl`.requested_at DESC";

    $stmt = $connpcs->prepare($query);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $rows = $stmt->fetchAll();

        foreach ($rows as $row) {
            $changeType = strtolower(trim((string)$row["change_type"]));
            $changeRequestId = (int)$row["change_request_id"];
            $dispatchRequestId = (int)$row["request_id"];
            $requestedAt = (string)$row["requested_at"];
            $status = mapChangeRequestStatus($row["status"] ?? null);
            $displayId = formatChangeRequestDisplayId(
                $changeType,
                $changeRequestId,
                $requestedAt
            );

            $base = [
                "id" => $changeRequestId,
                "request_id" => $displayId,
                "employee_name" => getName((int)$row["emp_number"]),
                "employee_id" => (string)$row["emp_number"],
                "group_id" => (int)$row["group_id"],
                "group_name" => $row["group_name"] ?? "",
                "original_dispatch_request_id" => "REQ-" . $dispatchRequestId,
                "dispatch_request_id" => $dispatchRequestId,
                "reason" => $row["reason"] ?? "",
                "date_requested" => date("Y-m-d", strtotime($requestedAt)),
                "requested_by" => getName((int)$row["requested_by"]),
                "requested_by_id" => (int)$row["requested_by"],
                "status" => $status,
            ];

            if ($changeType === "cancellation") {
                $result["data"]["cancellations"][] = array_merge($base, [
                    "dispatch_start" => $row["original_start_date"],
                    "dispatch_end" => $row["original_end_date"],
                ]);
                continue;
            }

            if ($changeType === "date_change") {
                $currentStart = $row["original_start_date"];
                $currentEnd = $row["original_end_date"];
                $proposedStart = $row["requested_start_date"] ?: $currentStart;
                $proposedEnd = $row["requested_end_date"] ?: $currentEnd;
                $currentDays = countDays($currentStart, $currentEnd);
                $proposedDays = countDays($proposedStart, $proposedEnd);

                $result["data"]["date_changes"][] = array_merge($base, [
                    "current_start" => $currentStart,
                    "current_end" => $currentEnd,
                    "proposed_start" => $proposedStart,
                    "proposed_end" => $proposedEnd,
                    "current_total_days" => $currentDays,
                    "proposed_total_days" => $proposedDays,
                    "net_change" => formatNetChangeDays($currentDays, $proposedDays),
                ]);
            }
        }
    }

    $result["isSuccess"] = true;
} catch (Exception $e) {
    $result["isSuccess"] = false;
    $result["message"] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
