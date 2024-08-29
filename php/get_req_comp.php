<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region MAIN QUERY
try {
  $getCompQ = "SELECT * FROM `company_list`";
  $getCompQStmt = $connpcs->prepare($getCompQ);
  $getCompQStmt->execute([]);
  if ($getCompQStmt->rowCount() > 0) {
    $result = $getCompQStmt->fetchAll();
    $msg['result'] = $result;
    $msg['isSuccess'] = true;
    $msg['error'] = "Successfully retrieved!";
  } else {
    $msg['isSuccess'] = false;
    $msg['error'] = "Failed to retrieve!";
  }
} catch (Exception $e) {
  $msg["isSuccess"] = false;
  $msg['error'] =  "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($msg);
