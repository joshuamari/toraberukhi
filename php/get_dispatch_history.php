<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$allyear = $empID = 0;
$year = date("Y");
$yearQuery = "";
$dispatch = array();
#endregion

#region get values
if (!empty($_POST["empID"])) {
    $empID = $_POST["empID"];
}
if (!empty($_POST['yScope'])) {
    $allyear = $_POST['yScope'];
}
if ($allyear == 1) {
    $yearQuery = "AND (dl.dispatch_from LIKE '$year-%' OR dl.dispatch_to LIKE '$year-%')";
}
#region mains
try {
    $dispatchQ = "SELECT dl.dispatch_id as id, dl.dispatch_from as fromDate, dl.dispatch_to as toDate, ll.location_name as locationName FROM dispatch_list as dl LEFT JOIN 
    location_list as ll ON dl.location_id = ll.location_id WHERE dl.emp_number = :empID $yearQuery ORDER BY dl.dispatch_from DESC";
    $dispatchStmt = $connpcs->prepare($dispatchQ);
    $dispatchStmt->execute([":empID" => "$empID"]);
    if ($dispatchStmt->rowCount() > 0) {
        $dispatchDeets = $dispatchStmt->fetchAll();

        foreach ($dispatchDeets as $val) {
            $from = new DateTime($val["fromDate"]);
            $to = new DateTime($val["toDate"]);

            // echo json_encode($from);
            // echo json_encode($to);

            $difference = $from->diff($to)->days;
            $val["duration"] = $difference + 1;
            $pastOne = getPastOneYear($empID, $val["toDate"]);
            $val["pastOne"] = $pastOne;

            if ($val["fromDate"] !== null) {
                $pass = strtotime($val["fromDate"]);
                $val["fromDate"] = date("d M Y", $pass);
            }
            if ($val["toDate"] !== null) {
                $visa = strtotime($val["toDate"]);
                $val["toDate"] = date("d M Y", $visa);
            }

            array_push($dispatch, $val);
        }
    }
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
#endregion

#region FUNCTIONS
function getPastOneYear($empID, $lastDay)
{
    global $connpcs;
    $firstDay = date('Y-m-d', strtotime($lastDay . '-1 year'));
    $dispatchQ = "SELECT SUM(DATEDIFF(LEAST(:endYear, dispatch_to), GREATEST(:startYear, dispatch_from)) + 1) AS days_in_year FROM `dispatch_list`
    WHERE `dispatch_from` >= :startYear AND `dispatch_to` <= :endYear AND emp_number=:empID";
    $dispatchStmt = $connpcs->prepare($dispatchQ);
    $dispatchStmt->execute([":startYear" => $firstDay, ":endYear" => $lastDay, ":empID" => $empID]);
    $dispatchCount = $dispatchStmt->fetchColumn();
    return (int)$dispatchCount;
}
#endregion
echo json_encode($dispatch);
