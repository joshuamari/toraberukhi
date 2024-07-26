<?php
#region Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods');
#endregion

#region DB Connect
require_once '../../dbconn/dbconnectpcs.php';
require_once '../../dbconn/dbconnectnew.php';
require_once '../../global/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$result = [
    "isSuccess" => FALSE,
    "message" => "",
    "data" => array()
];
$status = NULL;
$userID = getID();
$devs = [464, 487, 510, 518, 521];
$presID = getPresID();
$devs[] = $presID;
$data = json_decode(file_get_contents("php://input"), true);
$empty = [];
$input = [];
$required_fields = ['request_status', 'request_id'];
foreach ($required_fields as $field) {
    if (isset($data[$field])) {
        $input[$field] = html_entity_decode($data[$field], ENT_QUOTES, 'UTF-8');
    } else {
        $empty[] = ucfirst($field);
    }
}
$status = $input['request_status'];
#endregion

#region validations
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    $result['message'] = 'Method not allowed';
    die(json_encode($result));
}
if (count($empty)) {
    $lastElement = array_pop($empty);
    $emptyMessage = implode(", ", $empty);
    if (!empty($emptyMessage)) {
        $emptyMessage .= ", and ";
    }
    $emptyMessage .= $lastElement . " cannot be empty";
    $output['message'] = $emptyMessage;
    die(json_encode($output));
}
if (!in_array($userID, $devs)) {
    $result["message"] = "Not authorized";
    die(json_encode($result));
}
#endregion

#region main function
$connpcs->beginTransaction();
try {
    $udpateQ = "UPDATE `request_list` SET `request_status`=:request_status WHERE `request_id`=:request_id ";
    $updateStmt = $connpcs->prepare($udpateQ);
    $updateStmt->execute([":request_status" => $status, ":request_id" => $input['request_id']]);
    if ($updateStmt->rowCount() > 0) {
        $details = getRequestDetails($input['request_id']);
        if ($status == 1) {
            $updateDQ = "INSERT INTO `dispatch_list`(`emp_number`,`location_id`,`dispatch_from`,`dispatch_to`,`request_id`)  VALUES(:emp_number, :location_id, :dispatch_from, :dispatch_to, :request_id)";
            $updateDQStmt = $connpcs->prepare($updateDQ);
            $updateDQStmt->execute([
                ":emp_number" => $details['emp_number'],
                ":location_id" => $details['location_id'],
                ":dispatch_from" => $details['dispatch_from'],
                ":dispatch_to" => $details['dispatch_to'],
                ":request_id" => $input['request_id']
            ]);
            if ($updateDQStmt->rowCount() < 1) {
                $result['message'] = 'Failed to insert into dispatch list';
                $connpcs->rollBack();
                die(json_encode($result));
            }
        }
        if (emailStatusChange($status, $details)) {
            $text = $status ? "approved" : "denied";
            $result['isSuccess'] = TRUE;
            $result['message'] = "Successfully $text";
            $connpcs->commit();
        } else {
            $result['message'] = "Mail failed";
            $connpcs->rollBack();
            die(json_encode($result));
        }
    } else {
        $connpcs->rollBack();
        $result['message'] = '0 rows updated';
        die(json_encode($result));
    }
} catch (Exception $e) {
    $connpcs->rollBack();
    $result['isSuccess'] = FALSE;
    $result['message'] = "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($result);
