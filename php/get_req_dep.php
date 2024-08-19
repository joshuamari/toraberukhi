<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region MAIN QUERY
try{
  $getDepQ = "SELECT `id`, `department_name` as `dep_name` FROM `requesters_dep`";
  $getDepQStmt = $connpcs->prepare($getDepQ);
  $getDepQStmt->execute([]);
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