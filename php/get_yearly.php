<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$empID = 0;
$yearlyDeets = array();
$yearNow = date('Y');
$yearPast = $yearNow - 1;
$yearFuture = $yearNow + 1;
$startNow = date('Y-01-01');
$endNow = date('Y-12-31');
$startPast = date('Y-01-01', strtotime('-1 year'));
$endPast = date('Y-12-31', strtotime('-1 year',));
$startFuture = date('Y-01-01', strtotime('+1 year'));
$endFuture = date('Y-12-31', strtotime('+1 year',));
#endregion

#region get data values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
}
#endregion

#region main function
try {
    $total[$yearPast] = totalDuration($startPast, $endPast, $yearPast);
    $total[$yearNow] = totalDuration($startNow, $endNow, $yearNow);
    $total[$yearFuture] = totalDuration($startFuture, $endFuture, $yearFuture);
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

echo json_encode($total);

#region function
function totalDuration($startYear, $endYear, $dateNow)
{
    global $empID, $connpcs;
    $totalDays = 0;

    $yearNowQ = "SELECT dispatch_id, dispatch_from, dispatch_to FROM dispatch_list WHERE emp_number = :empID AND 
    ((`dispatch_from` >= :startYear AND `dispatch_from` <= :endYear) OR (`dispatch_to` <= :endYear AND `dispatch_to` >= :startYear))";
    $yearNowStmt = $connpcs->prepare($yearNowQ);
    $yearNowStmt->execute([":empID" => "$empID", ":startYear" => "$startYear", ":endYear" => "$endYear"]);
    if ($yearNowStmt->rowCount() > 0) {
        $dispatch = $yearNowStmt->fetchAll();

        foreach ($dispatch as $val) {
            $dateFrom = $val["dispatch_from"];
            $dateTo = $val["dispatch_to"];
            $daysDiff = getDuration($dateFrom, $dateTo, $dateNow);
            $totalDays += $daysDiff;
        }
    }

    return $totalDays;
}

function getDuration($dateFrom, $dateTo, $dateNow)
{
    $yearNow = $dateNow;
    $dateFromYear = date("Y", strtotime($dateFrom));
    $dateToYear = date("Y", strtotime($dateTo));

    if ($dateFrom > $dateTo) {
        return 0;
    }

    if ($dateFromYear != $yearNow && $dateToYear == $yearNow) {
        $startYear = $yearNow . "-01-01";
        $endYear = $dateTo;
    } else if ($dateFromYear == $yearNow && $dateToYear == $yearNow) {
        $startYear = $dateFrom;
        $endYear = $dateTo;
    } else if ($dateFromYear == $yearNow && $dateToYear != $yearNow) {
        $startYear = $dateFrom;
        $endYear = $yearNow . "-12-31";
    } else {
        $startYear = $yearNow . "-12-31";
        $endYear = $yearNow . "-12-31";
    }
    $startYear = new DateTime($startYear);
    $endYear = new DateTime($endYear);

    $difference = $startYear->diff($endYear);

    return $difference->days + 1;
}
#endregion