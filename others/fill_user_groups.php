<?php

include "../dbconn/dbconnectpcs.php";

$getKhi = "SELECT * FROM `khi_details`";
$getKhiStmt = $connpcs->prepare($getKhi);
$getKhiStmt->execute([]);
$khiList = $getKhiStmt->fetchAll();

foreach($khiList as $khi) {
    $id = $khi['number'];
    $group = $khi['group_id'];

    $insert = "INSERT IGNORE INTO `khi_user_groups`(`user_id`, `group_id`) VALUES (:id, :group)";
    $insertStmt = $connpcs->prepare($insert);
    $insertStmt->execute([":id" => "$id", ":group" => "$group"]);
}