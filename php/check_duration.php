<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
// require_once '../dbconn/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$dispatchCount = 0;
$empNum = NULL;
if (!empty($_POST['empID'])) {
    $empNum = $_POST['empID'];
}
$startYear = date("Y-01-01");
$endYear = date("Y-12-31");

$dispatchQ = "SELECT dispatch_id, dispatch_from, dispatch_to FROM `dispatch_list` WHERE emp_number = :empID AND 
((`dispatch_from` >= :startYear AND `dispatch_from` <= :endYear) OR (`dispatch_to` <= :endYear AND `dispatch_to` >= :startYear))";
$dispatchStmt = $connpcs->prepare($dispatchQ);
#endregion

#region Entries Query
try {
    $dispatchStmt->execute([":startYear" => $startYear, ":endYear" => $endYear, ":empID" => $empNum]);
    if ($dispatchStmt->rowCount() > 0) {
        $dispatchDeets = $dispatchStmt->fetchAll();

        foreach ($dispatchDeets as $val) {
            $dateFrom = $val["dispatch_from"];
            $dateTo = $val["dispatch_to"];
            $daysDiff = getDuration($dateFrom, $dateTo);

            $dispatchCount += $daysDiff + 1;
        }
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
    $errorMsg['catch'] =  "Connection failed: " . $e->getMessage();
}
#endregion

echo $dispatchCount;

#region function
function getDuration($dateFrom, $dateTo)
{
    $yearNow = date("Y");
    $dateFromYear = date("Y", strtotime($dateFrom));
    $dateToYear = date("Y", strtotime($dateTo));

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

    return $difference->days;
}
#endregion