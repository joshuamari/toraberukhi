<?php
require_once 'dbconnectkdtph.php'; //database connection
$output=array();
$userHash='';
if(isset($_COOKIE['userID'])){
    $userHash=$_COOKIE['userID'];
}
if(!empty($userHash)){
    $loginQ="SELECT fldEmployeeNum FROM kdtlogin WHERE fldUserHash='$userHash'";
    $loginStmt=$connkdt->query($loginQ);
    if($loginStmt->rowCount()>0){
        $userLogin=$loginStmt->fetchColumn();
        $output+=["empNum"=>$userLogin];
        $empDeetsQ="SELECT * FROM emp_prof WHERE fldEmployeeNum='$userLogin'";
        $empDeetsStmt=$connkdt->query($empDeetsQ);
        $empDeetsArr=$empDeetsStmt->fetchAll();
        foreach($empDeetsArr AS $empdeets){
            $output+=["empGroup"=>$empdeets['fldGroup']];
            $output+=["empFName"=>$empdeets['fldFirstname']];
            $output+=["empSName"=>$empdeets['fldSurname']];
            $output+=["empNName"=>$empdeets['fldNick']];
            $output+=["empDateHired"=>$empdeets['fldDateHired']];
            $output+=["empPos"=>$empdeets['fldDesig']];
        }
    }
}
echo json_encode($output);
