<?php
#region DB Connect
require_once '../../dbconn/dbconnectnew.php';
require_once '../../dbconn/dbconnectpcs.php';
require_once '../../dbconn/dbconnectkdtph.php';
require_once '../../global/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

header('Content-Type: application/json');

$message = [
    "isSuccess" => 0,
    "message" => ""
];

$errors = [];

#region Set Variable Values
$empID = isset($_POST["empID"]) ? trim($_POST["empID"]) : "";
if ($empID === "") {
    $errors[] = "Employee ID";
}

$empacc = isset($_POST["empacc"]) ? trim($_POST["empacc"]) : "";
if ($empacc === "") {
    $errors[] = "Access Type";
}

$empEMAIL = isset($_POST["empemail"]) ? trim($_POST["empemail"]) : "";
if ($empEMAIL === "") {
    $errors[] = "Employee Email";
}

$grpID = $_POST["grpID"] ?? null;

if ($grpID === null || $grpID === "") {
    $errors[] = "Group ID";
    $grpID = [];
} else {
    if (!is_array($grpID)) {
        $grpID = [$grpID];
    }

    $grpID = array_map(function ($value) {
        return trim((string)$value);
    }, $grpID);

    $grpID = array_filter($grpID, function ($value) {
        return $value !== '' && is_numeric($value);
    });

    $grpID = array_values(array_unique($grpID));

    if (count($grpID) === 0) {
        $errors[] = "Group ID";
    }
}
#endregion

#region Return validation errors
if (!empty($errors)) {
    if (count($errors) > 1) {
        $last = array_pop($errors);
        $message["message"] = "'" . implode("', '", $errors) . "' and '" . $last . "' Missing";
    } else {
        $message["message"] = $errors[0] . " Missing";
    }

    echo json_encode($message);
    exit;
}
#endregion

$primaryGroupID = $grpID[0];

try {
    $connpcs->beginTransaction();

    // update user email and main group
    $editUser = "UPDATE `khi_details`
                 SET `email` = :empEMAIL,
                     `group_id` = :groupID
                 WHERE `number` = :empID";
    $editUserStmt = $connpcs->prepare($editUser);
    $editUserStmt->execute([
        ":empID" => $empID,
        ":empEMAIL" => $empEMAIL,
        ":groupID" => $primaryGroupID
    ]);

    // replace groups
    $deleteGroup = "DELETE FROM `khi_user_groups` WHERE `user_id` = :empID";
    $deleteGroupStmt = $connpcs->prepare($deleteGroup);
    $deleteGroupStmt->execute([
        ":empID" => $empID
    ]);

    $addGroup = "INSERT INTO `khi_user_groups` (`user_id`, `group_id`) VALUES (:empID, :groupID)";
    $addGroupStmt = $connpcs->prepare($addGroup);

    foreach ($grpID as $groupID) {
        $addGroupStmt->execute([
            ":empID" => $empID,
            ":groupID" => $groupID
        ]);
    }

    // replace permissions
    $delPerm = "DELETE FROM `khi_user_permissions` WHERE `employee_id` = :empID";
    $delPermStmt = $connpcs->prepare($delPerm);
    $delPermStmt->execute([
        ":empID" => $empID
    ]);

    if ((string)$empacc === "1") {
        $editPerm = "INSERT INTO `khi_user_permissions` (`permission_id`, `employee_id`) VALUES (1, :empID)";
        $editPermStmt = $connpcs->prepare($editPerm);
        $editPermStmt->execute([
            ":empID" => $empID
        ]);
    }

    $connpcs->commit();

    $message["isSuccess"] = 1;
    $message["message"] = "User successfully updated";
} catch (Exception $e) {
    if ($connpcs->inTransaction()) {
        $connpcs->rollBack();
    }

    $message["isSuccess"] = 0;
    $message["message"] = $e->getMessage();
}

echo json_encode($message);