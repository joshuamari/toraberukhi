<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
// require_once '../dbconn/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

$difference = $trueDiff = 0;
$toPrint = array();
$yearNow = date("Y");
$dateFrom = $dateTo = date("Y", 0 - 0 - 0000);
$dFrom = $dTo = 0 - 0 - 0000;
if (!empty($_POST["dateFrom"])) {
    $dFrom = $_POST["dateFrom"];
    $dateFrom = date("Y", strtotime($_POST["dateFrom"]));
}
if (!empty($_POST["dateTo"])) {
    $dTo = $_POST["dateTo"];
    $dateTo = date("Y", strtotime($_POST["dateTo"]));
}

if ($dateFrom != $yearNow && $dateTo == $yearNow && $dFrom <= $dTo) {
    $startYear = $yearNow . "-01-01";
    $endYear = $_POST["dateTo"];
} else if ($dateFrom == $yearNow && $dateTo == $yearNow && $dFrom <= $dTo) {
    $startYear = $_POST["dateFrom"];
    $endYear = $_POST["dateTo"];
} else if ($dateFrom == $yearNow && $dateTo != $yearNow && $dFrom <= $dTo) {
    $startYear = $_POST["dateFrom"];
    $endYear = $yearNow . "-12-31";
} else {
    $startYear = $yearNow . "-12-31";
    $endYear = $yearNow . "-12-31";
}
$startYear = new DateTime($startYear);
$endYear = new DateTime($endYear);

if ($dFrom <= $dTo) {
    $trueStart = new DateTime($_POST["dateFrom"]);
    $trueEnd = new DateTime($_POST["dateTo"]);

    $trueDiff = $trueStart->diff($trueEnd)->days;
    $difference = $startYear->diff($endYear)->days;

    if ($difference == 0) {
        $toPrint["toAdd"] = $difference;
    } else {
        $toPrint["toAdd"] = $difference + 1;
    }

    if ($trueDiff == 0) {
        $toPrint["difference"] = $trueDiff;
    } else {
        $toPrint["difference"] = $trueDiff + 1;
    }
} else {
    $toPrint["toAdd"] = 0;
    $toPrint["difference"] = 0;
}

echo json_encode($toPrint);
