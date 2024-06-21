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
$msg = array();
$empNumber = NULL;
if (!empty($_POST['empID'])) {
    $empNumber = $_POST['empID'];
} else {
    $msg["isSuccess"] = false;
    $msg['error'] = "Employee Number Missing";
}
$conn_pcs_disable->beginTransaction();
$insertQ = "UPDATE `khi_details` SET `is_active` = 0 WHERE `number` = :empNumber";
$insertStmt = $conn_pcs_disable->prepare($insertQ);
$removeQ = "DELETE FROM `khi_user_permissions` WHERE `employee_id`=:empNumber";
$removeStmt = $conn_pcs_disable->prepare($removeQ);
$deleteG = "DELETE FROM `khi_user_groups` WHERE `user_id` = :empNumber";
$deleteGStmt = $conn_pcs_disable->prepare($deleteG);
#endregion

#region Entries Query
try {
    if (empty($msg)) {
        if ($insertStmt->execute([":empNumber" => $empNumber])) {
            if ($removeStmt->execute([":empNumber" => $empNumber]) && $deleteGStmt->execute([":empNumber" => $empNumber])) {
                $conn_pcs_disable->commit();
                $msg["isSuccess"] = true;
                $msg["error"] = "KHI Member Deleted Successfully";
            } else {
                $conn_pcs_disable->rollBack();
            }
        } else {
            $conn_pcs_disable->rollBack();
        }
    } else {
        $conn_pcs_disable->rollBack();
    }
} catch (Exception $e) {
    $msg["isSuccess"] = false;
    $msg['error'] =  "Connection failed: " . $e->getMessage();
}

#endregion
// echo json_encode(array('errors' => $errorMsg), JSON_PRETTY_PRINT);
echo json_encode($msg);
