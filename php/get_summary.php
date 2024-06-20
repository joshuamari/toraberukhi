<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
require_once '../dbconn/dbconnectkdtph.php';
require_once '../dbconn/dbconnectnew.php';
require_once '../global/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#regio set variables
$summary = [];
$months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
$yNow = date("Y");
$firstday = $yNow . "-01-01";
$lastday = $yNow . "-12-31";
#endregion

try {
    foreach ($months as $month) {
        $totalPerMonth = [];
        $endDate = $yNow . "-" . $month . "-31";

        $dateObj   = DateTime::createFromFormat('!m', $month);
        $monthName = $dateObj->format('F');

        $getSummary = "SELECT COUNT(*) as `total` FROM `dispatch_list` WHERE :endDate BETWEEN `dispatch_from` AND `dispatch_to`";
        $getSummaryStmt = $connpcs->prepare($getSummary);
        $getSummaryStmt->execute([":endDate" => "$endDate"]);
        $total = $getSummaryStmt->fetchColumn();

        $totalPerMonth['month'] = $monthName;
        $totalPerMonth['rate'] = $total;

        $summary[] = $totalPerMonth;
    }

    echo json_encode($summary);
} catch (Exception $e) {
    echo "Connection error: " . $e->getMessage();
}
