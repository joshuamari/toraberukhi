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
#endregion

#region Set Variable Values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Employee ID';
}
if (!empty($_POST["grpID"])) {
    $grpID = $_POST["grpID"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Group ID';
}
if (isset($_POST["empacc"])) {
    $empacc = $_POST["empacc"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Access Type';
}
if (!empty($_POST["empemail"])) {
  $empEMAIL = $_POST["empemail"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Employee Email';
}
#for separation of error
if (!empty($msg)) {
	if (count($msg['message']) > 1) {
		$errorString = '';
		foreach ($msg['message'] as $result) {
			if ($result === end($msg['message'])) {
				$errorString .= "and '$result' Missing";
			}
			else {
				$errorString .= "'$result', ";
			}
		}
		$msg['message'] = $errorString;
	} else {
    $msg['message'] = implode("", $msg['message']);
    $msg['message'] .= " Missing";
  }
	die(json_encode($msg));
}
$connpcs->beginTransaction();
#endregion

$permChanges = TRUE;

#region main query
try {
  $editUser = "UPDATE `khi_details` SET `group_id` = :grpID, `email` = :empEMAIL WHERE `number` = :empID";
  $editUserStmt = $connpcs->prepare($editUser);
  $editUserStmt->execute([":grpID" => "$grpID", ":empID" => "$empID", ":empEMAIL" => "$empEMAIL"]);

  $delPerm = "DELETE FROM `khi_user_permissions` WHERE `employee_id` = :empID";
  $delPermStmt = $connpcs->prepare($delPerm);
  $delPermStmt->execute([":empID" => "$empID"]);
  $counterPerm = 0;

  if ($empacc == 1) {
    $editPerm = "INSERT INTO `khi_user_permissions`(`permission_id`, `employee_id`) VALUES (1, :empID)";
    $editPermStmt = $connpcs->prepare($editPerm);
    $editPermStmt->execute([":empID" => "$empID"]);
    $counterPerm = $editPermStmt->rowCount();
  }

  if ($editUserStmt->rowCount() > 0 || ($delPermStmt->rowCount() != $counterPerm)) {
      $connpcs->commit();
      $message["isSuccess"] = 1;
      $message["message"] = "User successfully updated";
  } else {
      $connpcs->rollBack();
      $message["isSuccess"] = 0;
      $message["message"] = "No change has been made";
  }
    // }
} catch (Exception $e) {
    $connpcs->rollBack();
    echo "Connection failed: " . $e->getMessage();
}
#endregion
echo json_encode($message);
