<?php
require '../../dbconn/dbconnectpcs.php';
session_start();

$khiID = 0;
$message = [];

if (!empty($_POST['khiID'])) {
    $khiID = $_POST['khiID'];
}

try {
    $checkID = "SELECT `number`, `surname`, `firstname`, `group_id` FROM `khi_details` WHERE `number` = :khiID";
    $checkIDStmt = $connpcs->prepare($checkID);
    $checkIDStmt->execute([":khiID" => "$khiID"]);
    if ($checkIDStmt->rowCount() > 0) {
        $empDeets = $checkIDStmt->fetchObject();
        $userID = $empDeets->number;

        $setCookie = urlencode(base64_encode($userID));
        $setCookie = bin2hex($setCookie);
        // setcookie("taguroID", $setCookie, 0, '/', 'kdtw637');
        if ($_SESSION["IDKHI"] = $setCookie) {
            $message['user'] = $empDeets;
            $message['message'] = 'Login successfull';
            $message['isSuccess'] = 1;
        } else {
            $message['isSuccess'] = 0;
            $message['message'] = 'Session not set';
        }
    } else {
        $message['isSuccess'] = 0;
        $message['message'] = 'User ID is not registered';
    }

    echo json_encode($message);
} catch (Exception $e) {
    echo "Error : " . $e->getMessage();
}
