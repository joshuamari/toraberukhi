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
$msg = array();
#endregion

#region Set Variable Values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Employee ID';
}
if (!empty($_POST["fname"])) {
    $fname = $_POST["fname"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'First Name';
}
if (!empty($_POST["lname"])) {
    $lname = $_POST["lname"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Last Name';
}
if (!empty($_POST["grpID"])) {
    $grpID = $_POST["grpID"];
} else {
  $msg['isSuccess'] = 0;
  $msg['message'][] = 'Group';
}
if (!empty($_POST["empacc"])) {
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

#region main query
try {
    $checkID = "SELECT `is_active` FROM `khi_details` WHERE `number` = :empID";
    $checkIDStmt = $connpcs->prepare($checkID);
    $checkIDStmt->execute([":empID" => "$empID"]);
    $checkCount = $checkIDStmt->rowCount();
    $isActive = $checkIDStmt->fetchColumn();

    if ($checkCount == 0) {
        $insertUser = "INSERT INTO `khi_details`(`number`, `surname`, `firstname`, `group_id`, `email`, `is_active`) 
        VALUES (:empID, :lname, :fname, :grpID, :email, 1)";
    } else {
        if ($isActive == 0) {
            $insertUser = "UPDATE `khi_details` SET `surname` = :lname, `firstname` = :fname, `group_id` = :grpID, `email` = :email, `is_active` = 1 WHERE `number` = :empID";
        } else {
            $connpcs->rollBack();
            $message["isSuccess"] = 0;
            $message["message"] = "User ID already registered";
        }
    }

    $insertUserStmt = $connpcs->prepare($insertUser);
    if ($insertUserStmt->execute([":empID" => "$empID", ":lname" => "$lname", ":fname" => "$fname", ":grpID" => "$grpID", ":email" => $empEMAIL])) {
        if ($empacc == 1) {
            $insertAccess = "INSERT INTO `khi_user_permissions`(`permission_id`, `employee_id`) VALUES (1, :empID)";
            $insertAccessStmt = $connpcs->prepare($insertAccess);
            if ($insertAccessStmt->execute([":empID" => "$empID"])) {
            } else {
                $connpcs->rollBack();
            }
        }

        $insertGroups = "INSERT INTO `khi_user_groups`(`user_id`,`group_id`) VALUE (:empID, :grpID)";
        $insertGroupsStmt = $connpcs->prepare($insertGroups);
        if($insertGroupsStmt->execute([":empID" => "$empID", ":grpID" => "$grpID"])) {
            $connpcs->commit();
            $message["isSuccess"] = 1;
            $message["message"] = "User successfully added";
        } else {
            $connpcs->rollBack();
        }
    } else {
        $connpcs->rollBack();
    }
} catch (Exception $e) {
    $connpcs->rollBack();
    echo "Connection failed: " . $e->getMessage();
}
#endregion
echo json_encode($message);
