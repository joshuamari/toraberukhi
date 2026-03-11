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

$fname = isset($_POST["fname"]) ? trim($_POST["fname"]) : "";
if ($fname === "") {
    $errors[] = "First Name";
}

$lname = isset($_POST["lname"]) ? trim($_POST["lname"]) : "";
if ($lname === "") {
    $errors[] = "Last Name";
}

$empacc = isset($_POST["empacc"]) ? trim($_POST["empacc"]) : "";

$empEMAIL = isset($_POST["empemail"]) ? trim($_POST["empemail"]) : "";
if ($empEMAIL === "") {
    $errors[] = "Employee Email";
}

$grpID = $_POST["grpID"] ?? null;

if ($grpID === null || $grpID === "") {
    $errors[] = "Group";
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
        $errors[] = "Group";
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

// first selected group becomes main group in khi_details
$primaryGroupID = $grpID[0];

try {
    $connpcs->beginTransaction();

    $checkID = "SELECT `is_active` FROM `khi_details` WHERE `number` = :empID";
    $checkIDStmt = $connpcs->prepare($checkID);
    $checkIDStmt->execute([":empID" => $empID]);
    $existingRow = $checkIDStmt->fetch(PDO::FETCH_ASSOC);

    if (!$existingRow) {
        $insertUser = "INSERT INTO `khi_details`
            (`number`, `surname`, `firstname`, `group_id`, `email`, `is_active`)
            VALUES
            (:empID, :lname, :fname, :grpID, :email, 1)";
        $insertUserStmt = $connpcs->prepare($insertUser);
        $insertUserStmt->execute([
            ":empID" => $empID,
            ":lname" => $lname,
            ":fname" => $fname,
            ":grpID" => $primaryGroupID,
            ":email" => $empEMAIL
        ]);
    } else {
        if ((int)$existingRow["is_active"] === 1) {
            $connpcs->rollBack();
            $message["isSuccess"] = 0;
            $message["message"] = "User ID already registered";
            echo json_encode($message);
            exit;
        }

        $updateUser = "UPDATE `khi_details`
            SET `surname` = :lname,
                `firstname` = :fname,
                `group_id` = :grpID,
                `email` = :email,
                `is_active` = 1
            WHERE `number` = :empID";
        $updateUserStmt = $connpcs->prepare($updateUser);
        $updateUserStmt->execute([
            ":empID" => $empID,
            ":lname" => $lname,
            ":fname" => $fname,
            ":grpID" => $primaryGroupID,
            ":email" => $empEMAIL
        ]);

        $deleteOldGroups = "DELETE FROM `khi_user_groups` WHERE `user_id` = :empID";
        $deleteOldGroupsStmt = $connpcs->prepare($deleteOldGroups);
        $deleteOldGroupsStmt->execute([":empID" => $empID]);

        $deleteOldPerms = "DELETE FROM `khi_user_permissions` WHERE `employee_id` = :empID";
        $deleteOldPermsStmt = $connpcs->prepare($deleteOldPerms);
        $deleteOldPermsStmt->execute([":empID" => $empID]);
    }

    if ((string)$empacc === "1") {
        $insertAccess = "INSERT INTO `khi_user_permissions` (`permission_id`, `employee_id`)
                         VALUES (1, :empID)";
        $insertAccessStmt = $connpcs->prepare($insertAccess);
        $insertAccessStmt->execute([":empID" => $empID]);
    }

    $insertGroups = "INSERT INTO `khi_user_groups` (`user_id`, `group_id`)
                     VALUES (:empID, :grpID)";
    $insertGroupsStmt = $connpcs->prepare($insertGroups);

    foreach ($grpID as $groupID) {
        $insertGroupsStmt->execute([
            ":empID" => $empID,
            ":grpID" => $groupID
        ]);
    }

    $connpcs->commit();
    $message["isSuccess"] = 1;
    $message["message"] = "User successfully added";
} catch (Exception $e) {
    if ($connpcs->inTransaction()) {
        $connpcs->rollBack();
    }

    $message["isSuccess"] = 0;
    $message["message"] = $e->getMessage();
}

echo json_encode($message);