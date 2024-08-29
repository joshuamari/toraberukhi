<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region Initialize Variable
if (!empty($_POST['compID'])) {
  $comp_id = $_POST['compID'];
} else {
  $msg["isSuccess"] = false;
  $msg['error'][] = "Location";
}
#endregion

#region MAIN QUERY
try{
  $getDepQ = "SELECT `id`, `department_name` as `dep_name` FROM `requesters_dep` WHERE `comp_id` = :comp_id";
  $getDepQStmt = $connpcs->prepare($getDepQ);
  $getDepQStmt->execute([":comp_id" => $comp_id]);
  if ($getDepQStmt->rowCount() > 0) {
    $result = $getDepQStmt->fetchAll();
    $msg['result'] = $result;
    $msg['isSuccess'] = true;
    $msg['error'] = "Successfully retrieved!";
  }
  else {
    $msg['isSuccess'] = false;
    $msg['error'] = "Failed to retrieve!";
  }
} catch (Exception $e) {
  $msg["isSuccess"] = false;
  $msg['error'] =  "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($msg);