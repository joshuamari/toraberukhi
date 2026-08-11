<?php
#region DB Connect
require_once '../../dbconn/dbconnectnew.php';
require_once '../../dbconn/dbconnectpcs.php';
require_once '../../dbconn/dbconnectkdtph.php';
require_once '../../global/globalFunctions.php';
#endregion

session_start();
#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$result = [
    "isSuccess" => FALSE,
    "message" => "",
    "data" => array()
];
#endregion

#region helpers
function formatActivityTimestamp(?string $datetime): string
{
    $raw = trim((string)$datetime);
    if ($raw === "") {
        return "";
    }

    $ts = strtotime($raw);
    if ($ts === false) {
        return "";
    }

    return date("Y-m-d\TH:i:s", $ts) . "+08:00";
}

function formatActivityDisplayDate(?string $date): string
{
    $raw = trim((string)$date);
    if ($raw === "") {
        return "";
    }

    $ts = strtotime($raw);
    if ($ts === false) {
        return $raw;
    }

    return date("d M Y", $ts);
}

function formatChangeRequestDisplayId(string $changeType, int $changeRequestId): string
{
    $paddedId = str_pad((string)$changeRequestId, 5, "0", STR_PAD_LEFT);
    $prefix = $changeType === "cancellation" ? "CR" : "DCR";

    return "{$prefix}-{$paddedId}";
}

function normalizeChangeRequestStatus(?string $status): string
{
    $normalized = strtolower(trim((string)$status));

    return match ($normalized) {
        "approved", "accepted" => "approved",
        "declined", "rejected", "denied" => "declined",
        "withdrawn" => "withdrawn",
        "pending" => "pending",
        default => $normalized !== "" ? $normalized : "pending",
    };
}

/**
 * Prefer request_list.date_modified, but if that timestamp matches a change-request
 * decision it was overwritten — fall back to the earliest change request time.
 *
 * @param array<int, array<string, mixed>> $changeRows
 */
function resolveDispatchApprovalTimestamp(
    ?string $dateRequested,
    ?string $dateModified,
    array $changeRows
): string {
    $submittedAt = formatActivityTimestamp($dateRequested);
    $modifiedAt = formatActivityTimestamp($dateModified);
    $changeDecisionTimes = [];
    $earliestChangeRequestedAt = "";

    foreach ($changeRows as $change) {
        $requestedAt = formatActivityTimestamp($change["requested_at"] ?? null);
        $decisionAt = formatActivityTimestamp($change["date_modified"] ?? null);

        if ($requestedAt !== "" && ($earliestChangeRequestedAt === "" || $requestedAt < $earliestChangeRequestedAt)) {
            $earliestChangeRequestedAt = $requestedAt;
        }

        if ($decisionAt !== "") {
            $changeDecisionTimes[] = $decisionAt;
        }
    }

    if ($modifiedAt !== "" && in_array($modifiedAt, $changeDecisionTimes, true)) {
        if ($earliestChangeRequestedAt !== "") {
            return $earliestChangeRequestedAt;
        }

        if ($submittedAt !== "") {
            return $submittedAt;
        }
    }

    if ($modifiedAt !== "") {
        return $modifiedAt;
    }

    return $submittedAt;
}

/**
 * @param array<int, array<string, mixed>> $changeRows
 * @return array<int, array<string, mixed>>
 */
function buildRequestActivityLog(
    int $requestId,
    ?string $dateRequested,
    $requestStatus,
    ?string $dateModified,
    string $requesterName,
    array $changeRows
): array {
    $events = [];
    $approverName = "KDT President";
    $hasApprovedCancellation = false;

    $submittedAt = formatActivityTimestamp($dateRequested);
    if ($submittedAt !== "") {
        $events[] = [
            "activityId" => "ACT-{$requestId}-submitted",
            "eventType" => "dispatch_submitted",
            "occurredAt" => $submittedAt,
            "actorName" => $requesterName,
            "description" => "The dispatch request was submitted.",
        ];
    }

    foreach ($changeRows as $change) {
        $changeType = strtolower(trim((string)($change["change_type"] ?? "")));
        $changeStatus = normalizeChangeRequestStatus($change["status"] ?? null);
        $changeRequestId = (int)($change["change_request_id"] ?? 0);
        $requestedAtRaw = (string)($change["requested_at"] ?? "");
        $decisionAtRaw = (string)($change["date_modified"] ?? "");
        $requestedByName = trim((string)($change["requested_by_name"] ?? ""));
        $displayId = formatChangeRequestDisplayId(
            $changeType,
            $changeRequestId
        );
        $requestedAt = formatActivityTimestamp($requestedAtRaw);
        $decisionAt = formatActivityTimestamp($decisionAtRaw);

        if ($changeType === "date_change") {
            $originalStart = formatActivityDisplayDate($change["original_start_date"] ?? null);
            $originalEnd = formatActivityDisplayDate($change["original_end_date"] ?? null);
            $requestedStart = formatActivityDisplayDate($change["requested_start_date"] ?? null);
            $requestedEnd = formatActivityDisplayDate($change["requested_end_date"] ?? null);
            $periodText = "";
            if ($originalStart !== "" && $originalEnd !== "" && $requestedStart !== "" && $requestedEnd !== "") {
                $periodText = " from {$originalStart} – {$originalEnd} to {$requestedStart} – {$requestedEnd}";
            }

            $requestDescription = "A date-change request was submitted{$periodText}.";

            if ($requestedAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-dcr-{$changeRequestId}-requested",
                    "eventType" => "date_change_requested",
                    "occurredAt" => $requestedAt,
                    "actorName" => $requestedByName,
                    "description" => $requestDescription,
                    "changeRequestType" => "date_change",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            }

            if ($changeStatus === "approved" && $decisionAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-dcr-{$changeRequestId}-accepted",
                    "eventType" => "date_change_accepted",
                    "occurredAt" => $decisionAt,
                    "actorName" => $approverName,
                    "description" => "The proposed dispatch dates were accepted.",
                    "changeRequestType" => "date_change",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            } elseif ($changeStatus === "declined" && $decisionAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-dcr-{$changeRequestId}-rejected",
                    "eventType" => "date_change_rejected",
                    "occurredAt" => $decisionAt,
                    "actorName" => $approverName,
                    "description" => "The proposed dispatch dates were rejected.",
                    "changeRequestType" => "date_change",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            } elseif ($changeStatus === "withdrawn" && $decisionAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-dcr-{$changeRequestId}-withdrawn",
                    "eventType" => "date_change_withdrawn",
                    "occurredAt" => $decisionAt,
                    "actorName" => $requestedByName,
                    "description" => "The date-change request was withdrawn.",
                    "changeRequestType" => "date_change",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            }

            continue;
        }

        if ($changeType === "cancellation") {
            $requestDescription = "A cancellation request was submitted.";

            if ($requestedAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-cr-{$changeRequestId}-requested",
                    "eventType" => "cancellation_requested",
                    "occurredAt" => $requestedAt,
                    "actorName" => $requestedByName,
                    "description" => $requestDescription,
                    "changeRequestType" => "cancellation",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            }

            if ($changeStatus === "approved" && $decisionAt !== "") {
                $hasApprovedCancellation = true;
                $events[] = [
                    "activityId" => "ACT-{$requestId}-cr-{$changeRequestId}-accepted",
                    "eventType" => "cancellation_accepted",
                    "occurredAt" => $decisionAt,
                    "actorName" => $approverName,
                    "description" => "The cancellation request was accepted.",
                    "changeRequestType" => "cancellation",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
                $events[] = [
                    "activityId" => "ACT-{$requestId}-cancelled-{$changeRequestId}",
                    "eventType" => "dispatch_cancelled",
                    "occurredAt" => $decisionAt,
                    "actorName" => $approverName,
                    "description" => "The dispatch request was cancelled.",
                ];
            } elseif ($changeStatus === "declined" && $decisionAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-cr-{$changeRequestId}-rejected",
                    "eventType" => "cancellation_rejected",
                    "occurredAt" => $decisionAt,
                    "actorName" => $approverName,
                    "description" => "The cancellation request was rejected.",
                    "changeRequestType" => "cancellation",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            } elseif ($changeStatus === "withdrawn" && $decisionAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-cr-{$changeRequestId}-withdrawn",
                    "eventType" => "cancellation_withdrawn",
                    "occurredAt" => $decisionAt,
                    "actorName" => $requestedByName,
                    "description" => "The cancellation request was withdrawn.",
                    "changeRequestType" => "cancellation",
                    "changeRequestId" => (string)$changeRequestId,
                    "changeRequestReference" => $displayId,
                ];
            }
        }
    }

    $statusValue = $requestStatus;
    $approvalAt = resolveDispatchApprovalTimestamp(
        $dateRequested,
        $dateModified,
        $changeRows
    );
    $decisionAt = formatActivityTimestamp($dateModified);
    if ($decisionAt === "") {
        $decisionAt = $submittedAt;
    }

    if ($statusValue === null || $statusValue === "") {
        // Pending — submission (+ any change events) only.
    } elseif ((int)$statusValue === 1) {
        if ($approvalAt !== "") {
            $events[] = [
                "activityId" => "ACT-{$requestId}-approved",
                "eventType" => "dispatch_approved",
                "occurredAt" => $approvalAt,
                "actorName" => $approverName,
                "description" => "The dispatch request was approved.",
            ];
        }
    } elseif ((int)$statusValue === 0) {
        if ($hasApprovedCancellation) {
            if ($approvalAt !== "") {
                $events[] = [
                    "activityId" => "ACT-{$requestId}-approved",
                    "eventType" => "dispatch_approved",
                    "occurredAt" => $approvalAt,
                    "actorName" => $approverName,
                    "description" => "The dispatch request was approved.",
                ];
            }
        } elseif ($decisionAt !== "") {
            // Legacy denied / cancelled without a cancellation change request.
            $events[] = [
                "activityId" => "ACT-{$requestId}-declined",
                "eventType" => "dispatch_declined",
                "occurredAt" => $decisionAt,
                "actorName" => $approverName,
                "description" => "The dispatch request was declined.",
            ];
        }
    }

    return $events;
}

/**
 * @param array<int> $requestIds
 * @return array<int, array<int, array<string, mixed>>>
 */
function fetchChangeRequestsByRequestId(PDO $connpcs, array $requestIds): array
{
    $grouped = [];
    if (count($requestIds) === 0) {
        return $grouped;
    }

    $placeholders = implode(",", array_fill(0, count($requestIds), "?"));
    $changeQ = "SELECT
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
            `rcl`.date_modified
        FROM `pcosdb`.request_change_list rcl
        WHERE `rcl`.request_id IN ({$placeholders})
        ORDER BY `rcl`.requested_at ASC, `rcl`.change_request_id ASC";
    $changeStmt = $connpcs->prepare($changeQ);
    $changeStmt->execute(array_values($requestIds));
    $rows = $changeStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
        $requestId = (int)$row["request_id"];
        $row["requested_by_name"] = getName((int)$row["requested_by"]);
        $grouped[$requestId][] = $row;
    }

    return $grouped;
}
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

#region main query
try {
    $requestQ = "SELECT `rl`.request_id,`rl`.emp_number,`rl`.requester_id,`gll`.name as requester_group,`rl`.dispatch_from,`rl`.dispatch_to,`rl`.date_requested,`ll`.location_name,`rl`.specific_loc,`el`.group_id,`gl`.name,`pd`.passport_expiry,`vd`.visa_expiry,`rl`.request_status,`rl`.date_modified FROM `pcosdb`.request_list rl JOIN `kdtphdb_new`.employee_list el ON `rl`.emp_number=`el`.id LEFT JOIN `passport_details` 
    AS pd ON `pd`.emp_number=`el`.id LEFT JOIN `kdtphdb_new`.group_list gl ON `el`.group_id=`gl`.id LEFT JOIN `pcosdb`.khi_details kd ON `kd`.number=`rl`.requester_id LEFT JOIN `kdtphdb_new`.group_list gll ON `kd`.group_id=`gll`.id  LEFT JOIN `pcosdb`.location_list ll ON `rl`.location_id=`ll`.location_id LEFT JOIN `visa_details` AS vd ON `vd`.emp_number=`el`.id WHERE `rl`.emp_number != 0 $membersStatement ORDER BY `rl`.date_requested DESC";
    $requestStmt = $connpcs->prepare($requestQ);
    $requestStmt->execute();
    if ($requestStmt->rowCount() > 0) {
        $requestArr = $requestStmt->fetchAll();
        $requestIds = array_map(static function ($req) {
            return (int)$req["request_id"];
        }, $requestArr);
        $changesByRequestId = fetchChangeRequestsByRequestId($connpcs, $requestIds);

        foreach ($requestArr as $req) {
            $output = array();
            $passValidity = false;
            $visaValidity = false;
            $requestId = (int)$req['request_id'];
            $output["req_id"] = $requestId;
            $empnum = $req['emp_number'];
            $output["emp_name"] = getName($empnum);
            $output["emp_number"] = (int)$req['emp_number'];
            $output["group_id"] = (int)$req['group_id'];
            $output["specific_loc"] = $req['specific_loc'];
            $output["location"] = $req['location_name'];
            $output["group_name"] = $req['name'];
            $requesterID = (int)$req['requester_id'];
            $requesterName = getName($requesterID);
            $output["requester_name"] = $requesterName;
            $output["requester_group"] = $req['requester_group'];
            $output['from'] = $req['dispatch_from'];
            $to = $req['dispatch_to'];
            $output['to'] = $to;
            $output['duration'] = countDays($req['dispatch_from'], $to);
            $output['req_date'] = date("Y-m-d", strtotime($req['date_requested']));
            $passExp = $req['passport_expiry'];
            $visaExp = $req['visa_expiry'];
            if ($passExp && (strtotime($passExp) >= strtotime($to))) {
                $passValidity = true;
            }
            if ($visaExp && (strtotime($visaExp) >= strtotime($to))) {
                $visaValidity = true;
            }
            $output["passValid"] = $passValidity;
            $output["visaValid"] = $visaValidity;
            // $status = ($req['request_status'] === NULL) ? "Pending" : (($req['request_status'] === 1) ? "Approved" : "Denied");
            $status = $req['request_status'];
            $output['status'] = $status;
            $output['modified'] = $req['date_modified'];
            $requestChanges = $changesByRequestId[$requestId] ?? [];
            $pendingDateChange = false;
            $pendingCancellation = false;
            foreach ($requestChanges as $changeRow) {
                if (strtolower(trim((string)($changeRow['status'] ?? ''))) !== 'pending') {
                    continue;
                }
                $rowChangeType = strtolower(trim((string)($changeRow['change_type'] ?? '')));
                if ($rowChangeType === 'date_change') {
                    $pendingDateChange = true;
                } elseif ($rowChangeType === 'cancellation') {
                    $pendingCancellation = true;
                }
            }
            $output['pending_date_change_request'] = $pendingDateChange;
            $output['pending_cancellation_request'] = $pendingCancellation;
            $output['activityLog'] = buildRequestActivityLog(
                $requestId,
                $req['date_requested'] ?? null,
                $status,
                $req['date_modified'] ?? null,
                $requesterName,
                $requestChanges
            );
            $result['data'][] = $output;
        }
        $result["isSuccess"] = TRUE;
    }
} catch (Exception $e) {
    $result["isSuccess"] = FALSE;
    $result["message"] = "Connection failed: " . $e->getMessage();
}
#endregion
echo json_encode($result);
