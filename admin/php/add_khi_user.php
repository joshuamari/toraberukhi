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

#region Initialize Variable
$groupID = $empnum = $empacc = 0;
$fname = $lname = "";
#endregion

#region Set Variable Values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
}
if (!empty($_POST["fname"])) {
    $fname = $_POST["fname"];
}
if (!empty($_POST["lname"])) {
    $lname = $_POST["lname"];
}
if (!empty($_POST["grpID"])) {
    $grpID = $_POST["grpID"];
}
if (!empty($_POST["empacc"])) {
    $empacc = $_POST["empacc"];
}
$conn_pcs_disable->beginTransaction();
#endregion

#region main query
try {
    $checkID = "SELECT `is_active` FROM `khi_details` WHERE `number` = :empID";
    $checkIDStmt = $conn_pcs_disable->prepare($checkID);
    $checkIDStmt->execute([":empID" => "$empID"]);
    $checkCount = $checkIDStmt->rowCount();
    $isActive = $checkIDStmt->fetchColumn();

    if ($checkCount == 0) {
        $insertUser = "INSERT INTO `khi_details`(`number`, `surname`, `firstname`, `group_id`, `is_active`) 
        VALUES (:empID, :lname, :fname, :grpID, 1)";
    } else {
        if ($isActive == 0) {
            $insertUser = "UPDATE `khi_details` SET `surname` = :lname, `firstname` = :fname, `group_id` = :grpID, `is_active` = 1 WHERE `number` = :empID";
        } else {
            $conn_pcs_disable->rollBack();
            $message["isSuccess"] = 0;
            $message["message"] = "User ID already registered";
        }
    }

    $insertUserStmt = $conn_pcs_disable->prepare($insertUser);
    if ($insertUserStmt->execute([":empID" => "$empID", ":lname" => "$lname", ":fname" => "$fname", ":grpID" => "$grpID"])) {
        if ($empacc == 1) {
            $insertAccess = "INSERT INTO `khi_user_permissions`(`permission_id`, `employee_id`) VALUES (1, :empID)";
            $insertAccessStmt = $conn_pcs_disable->prepare($insertAccess);
            if ($insertAccessStmt->execute([":empID" => "$empID"])) {
            } else {
                $conn_pcs_disable->rollBack();
            }
        }

        $insertGroups = "INSERT INTO `khi_user_groups`(`user_id`,`group_id`) VALUE (:empID, :grpID)";
        $insertGroupsStmt = $conn_pcs_disable->prepare($insertGroups);
        if($insertGroupsStmt->execute([":empID" => "$empID", ":grpID" => "$grpID"])) {
            $conn_pcs_disable->commit();
            $message["isSuccess"] = 1;
            $message["message"] = "User successfully added";
        } else {
            $conn_pcs_disable->rollBack();
        }
    } else {
        $conn_pcs_disable->rollBack();
    }
} catch (Exception $e) {
    $conn_pcs_disable->rollBack();
    echo "Connection failed: " . $e->getMessage();
}
#endregion
echo json_encode($message);
