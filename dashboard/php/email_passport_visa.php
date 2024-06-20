<?php
#region DB Connect
require_once '../../dbconn/dbconnectpcs.php';
require_once '../../dbconn/dbconnectkdtph.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize variables
$adminMembers = array("panado-g1@global.kawasaki.com", "soriano-kdt@global.kawasaki.com", "magno-kdt@global.kawasaki.com", "mesias-kdt@global.kawasaki.com");
$adminMembers = implode(", ", $adminMembers);
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: kdtreminder@corp.khi.co.jp" . "\r\n";
$headers .= "CC: " . $adminMembers;
$subject = 'Expiring Passport (for testing)';
#endregion

#region main function
try {
    $expiryPassQ = "SELECT ed.emp_email as empEmail, TIMESTAMPDIFF(DAY, CURDATE(), pd.passport_expiry) AS expiringIn, pd.passport_expiry as expiringDate, pd.passport_number as 
    idNum FROM employee_details as ed LEFT JOIN passport_details as pd ON ed.emp_number = pd.emp_number WHERE pd.passport_expiry >= CURDATE() AND pd.passport_expiry <= 
    DATE_ADD(CURDATE(), INTERVAL 9 MONTH)";
    $expiryPassStmt = $connpcs->prepare($expiryPassQ);
    $expiryPassStmt->execute([]);
    if ($expiryPassStmt->rowCount() > 0) {
        $type = "passport";
        $expiryPass = $expiryPassStmt->fetchAll();
        $sendDays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
        sendEmail($expiryPass, $sendDays, $type);
    }

    $expiryVisaQ = "SELECT ed.emp_email as empEmail, TIMESTAMPDIFF(DAY, CURDATE(), vd.visa_expiry) AS expiringIn, vd.visa_expiry as expiringDate, vd.visa_number as 
    idNum FROM employee_details as ed LEFT JOIN visa_details as vd ON ed.emp_number = vd.emp_number WHERE vd.visa_expiry >= CURDATE() AND vd.visa_expiry <= 
    DATE_ADD(CURDATE(), INTERVAL 9 MONTH)";
    $expiryVisaStmt = $connpcs->prepare($expiryVisaQ);
    $expiryVisaStmt->execute([]);
    if ($expiryVisaStmt->rowCount() > 0) {
        $type = "visa";
        $expiryVisa = $expiryVisaStmt->fetchAll();
        $sendDays = [0, 30, 60, 90, 120, 150, 180];
        sendEmail($expiryVisa, $sendDays, $type);
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion


function sendEmail($expiryID, $sendDays, $type)
{
    global $headers, $subject;
    foreach ($expiryID as $val) {
        $expiringIn = $val["expiringIn"];
        $expiringDate = $val["expiringDate"];
        $email = $val["empEmail"];
        $idNum = $val["idNum"];

        if (in_array($expiringIn, $sendDays)) {
            $expiringDate = strtotime($expiringDate);
            $expiringDate = date("d M Y", $expiringDate);
            $message = "Your " . $type . " with number " . $idNum . " will be expiring in " . $expiringDate;
            if ($expiringIn == 0) {
                $message = "Your " . $type . " with number " . $idNum . " will be expiring today";
            }

            mail($email, $subject, $message, $headers);
            echo "success " . $expiringIn . " " . $email;
        } else {
            echo "fail " . $expiringIn . " " . $email;
        }
    }
}
