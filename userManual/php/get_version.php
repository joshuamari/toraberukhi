<?php
$ajaxArr = $_REQUEST["busterCall"];
$titleName = $_REQUEST["titleName"];
$headString="<title>$titleName</title>
<meta name='viewport' content='width=device-width, initial-scale=1'>
  <meta charset='UTF-8'> <link rel='stylesheet' type='text/css' href='../global.css'>
  <link rel='icon' href='../favicon.ico' type='image/x-icon'>
  <link rel='stylesheet' type='text/css' href='../tailwindcss.min.css'>
 
  <link rel='stylesheet' type='text/css' href='css/font-awesome.css'>
  <link rel='stylesheet' href='css/boxicons.css' />
  <link rel='stylesheet' href='css/bootstrap.min.css'>
  
  <script src='../tailwindcss.js'></script>
  <script src='js/jspdf.js'></script>
  <script src='js/jquery.js'></script>
  <script src='js/tableToExcel.js'></script>
  <script src='js/bootstrap.min.js'></script>
  ";
$addString = "";
//ADD TO ULI SA HEADSTRING BAT DI NAGANA
// <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
foreach($ajaxArr AS $element){
    switch(explode("/",$element)[0]){
        case "js":
            $version = date("YmdHis",filemtime("../$element"));
            $addString .= "<script src='$element?version=$version'></script>";
            break;
        case "css":
            $version = date("YmdHis",filemtime("../$element"));
            $addString .= "<link rel='stylesheet' type='text/css' href='$element?v=$version'>";
            break;
    }
}
echo $headString.$addString;
?>