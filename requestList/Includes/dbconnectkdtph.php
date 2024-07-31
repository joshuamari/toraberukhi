<?php 
$config = [
  'host' => 'localhost',
  'port' => 3306,
  'dbname' => 'kdtphdb',
  'charset' => 'utf8mb4'
];
$username = 'root';
$password = '';
$dsn = 'mysql:' . http_build_query($config, '', ';');
try {
  $connkdt = new PDO($dsn, $username, $password,[
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);
  $gods=['464','465','487'];
  $sys=array();
  $sysQ="SELECT fldEmployeeNum FROM emp_prof WHERE fldGroup='SYS' AND fldActive=1 AND fldEmployeeNum NOT IN (464,465,487,466)";
  $sysStmt=$connkdt->query($sysQ);
  $sysArr=$sysStmt->fetchAll();
  foreach($sysArr AS $syss){
    array_push($sys,$syss['fldEmployeeNum']);
  }
  $specialRequestNiSirLou=["483","474"];
  $kdtWholeItems=['1','2','16','18','20'];
  $khiWholeItems=['3','4','5','12','14'];
  $halfItems=['7','8','9','11','13','22','23','24'];
  $noCounterpartBU=array();
  $ncpbQ="SELECT fldBU FROM kdtbu WHERE fldKHICounterpart=0";
  $ncpbStmt=$connkdt->query($ncpbQ);
  if($ncpbStmt->rowCount()>0){
    $ncpbArr=$ncpbStmt->fetchAll();
    foreach($ncpbArr AS $ncpbs){
      array_push($noCounterpartBU,$ncpbs['fldBU']);
    }
  }
  $itMembers=array();
  $itQ="SELECT fldEmployeeNum FROM emp_prof WHERE fldGroup='IT' AND fldActive=1";
  $itStmt=$connkdt->query($itQ);
  $itArr=$itStmt->fetchAll();
  foreach($itArr AS $its){
    array_push($itMembers,$its['fldEmployeeNum']);
  }
  $mgaSM=array();
  $smQ="SELECT fldEmployeeNum FROM emp_prof WHERE fldDesig IN ('SM','KDTP') AND fldActive=1";
  $smStmt=$connkdt->query($smQ);
  $smArr=$smStmt->fetchAll();
  foreach($smArr AS $sms){
    array_push($mgaSM,$sms['fldEmployeeNum']);
  }
  $reportAllGroupAccess=[];
  $reportAllGroupAccess=array_merge($gods,$itMembers,$mgaSM,$sys,$specialRequestNiSirLou);
} catch(PDOException $e) {
  echo "Connection failed: " . $e->getMessage();
}
?>

