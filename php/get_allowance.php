<?php
#region DB Connect
require_once '../dbconn/dbconnectpcs.php';
require_once '../global/globalFunctions.php';
#endregion

#region set timezone
date_default_timezone_set('Asia/Manila');
#endregion

#region Initialize Variable
$empID = 0;
$allowance = array();
#endregion

#region get data values
if (!empty($_GET["empID"])) {
    $empID = $_GET["empID"];
}
#endregion

#region main function
$allowance = getAllowance($empID);
#endregion

echo json_encode($allowance);
