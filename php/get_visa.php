<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$empID = 0;
$visaDeets = array();
#endregion

#region get data values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
}
#endregion

#region main function
try {
    $visaQ = "SELECT visa_number as number, visa_issue as issue, visa_expiry as expiry FROM visa_details WHERE emp_number = :empID";
    $visaStmt = $connpcs->prepare($visaQ);
    $visaStmt->execute([":empID" => "$empID"]);
    if ($visaStmt->rowCount() > 0) {
        $visaDeets = $visaStmt->fetch();
        $isValid = true;
        $expiry = new DateTime($visaDeets["expiry"]);
        $dateNow = new DateTime();
        if ($expiry < $dateNow) {
            $isValid = false;
        }

        if ($visaDeets["issue"] !== null) {
            $visaIs = strtotime($visaDeets["issue"]);
            $visaDeets["issue"] = date("d M Y", $visaIs);
        }
        if ($visaDeets["expiry"] !== null) {
            $visaEx = strtotime($visaDeets["expiry"]);
            $visaDeets["expiry"] = date("d M Y", $visaEx);
        }
        $visaDeets['valid'] = $isValid;
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($visaDeets);
