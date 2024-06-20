<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$empID = 0;
$passportDeets = array();
#endregion

#region get data values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
}
#endregion

#region main function
try {
    $passportQ = "SELECT passport_number as number, passport_birthdate as bday, passport_issue as issue, passport_expiry as expiry FROM passport_details 
    WHERE emp_number = :empID";
    $passportStmt = $connpcs->prepare($passportQ);
    $passportStmt->execute([":empID" => "$empID"]);
    if ($passportStmt->rowCount() > 0) {
        $passportDeets = $passportStmt->fetch();
        $isValid = true;
        $expiry = new DateTime($passportDeets["expiry"]);
        $dateNow = new DateTime();
        if ($expiry < $dateNow) {
            $isValid = false;
        }

        if ($passportDeets["bday"] !== null) {
            $passportBd = strtotime($passportDeets["bday"]);
            $passportDeets["bday"] = date("d M Y", $passportBd);
        }
        if ($passportDeets["issue"] !== null) {
            $passportIs = strtotime($passportDeets["issue"]);
            $passportDeets["issue"] = date("d M Y", $passportIs);
        }
        if ($passportDeets["expiry"] !== null) {
            $passportEx = strtotime($passportDeets["expiry"]);
            $passportDeets["expiry"] = date("d M Y", $passportEx);
        }
        $passportDeets['valid'] = $isValid;
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($passportDeets);
