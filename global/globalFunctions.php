<?php
#region Functions
function checkOverlap($empnum, $range)
{
    global $connpcs;
    $isOverlap = false;
    $starttime = $range['start'];
    $endtime = $range['end'];
    $dispatchQ = "SELECT * FROM `dispatch_list` WHERE `emp_number` = :empnum AND ((`dispatch_from` BETWEEN :starttime AND :endtime OR `dispatch_to` BETWEEN :starttime AND :endtime) OR (:starttime BETWEEN `dispatch_from` AND `dispatch_to` OR :endtime BETWEEN `dispatch_from` AND `dispatch_to`))";
    $dispatchStmt = $connpcs->prepare($dispatchQ);
    $dispatchStmt->execute([":empnum" => $empnum, ":starttime" => $starttime, ":endtime" => $endtime]);
    if ($dispatchStmt->rowCount() > 0) {
        $isOverlap = true;
    }

    return $isOverlap;
}

function allGroupAccess($empnum)
{
    global $connpcs;
    $access = FALSE;
    $permissionID = 1;
    $userQ = "SELECT COUNT(*) FROM khi_user_permissions WHERE permission_id = :permissionID AND employee_id = :empID";
    $userStmt = $connpcs->prepare($userQ);
    $userStmt->execute([":empID" => $empnum, ":permissionID" => $permissionID]);
    $userCount = $userStmt->fetchColumn();
    if ($userCount > 0) {
        $access = TRUE;
    }
    return $access;
}

function getMembers($empnum)
{
    global $connnew;
    $members = array();
    $yearMonth = date("Y-m-01");
    $myGroups = getGroups($empnum);
    foreach ($myGroups as $grp) {
        $memsQ = "SELECT `id` FROM `employee_list` WHERE `group_id` = :grp AND (`resignation_date` IS NULL OR `resignation_date` = '0000-00-00' OR `resignation_date` > :yearMonth) 
        AND `nickname` <> ''";
        $memsStmt = $connnew->prepare($memsQ);
        $memsStmt->execute([":grp" => $grp['id'], ":yearMonth" => $yearMonth]);
        if ($memsStmt->rowCount() > 0) {
            $memArr = $memsStmt->fetchAll();
            $arrValues = array_column($memArr, "id");
            $members = array_merge($members, $arrValues);
        }
    }

    return $members;
}

function getGroups($empnum)
{
    global $connnew;
    $allGroupAccess = allGroupAccess($empnum);
    // echo $allGroupAccess;
    $myGroups = array();
    if (!$allGroupAccess) {
        $groupsQ = "SELECT gl.id AS `id`, gl.name AS `name`, gl.abbreviation AS `abbr` FROM kdtphdb_new.group_list AS gl JOIN pcosdb.khi_user_groups AS ku 
        ON gl.id = ku.group_id WHERE ku.user_id = :empnum";
        $groupsStmt = $connnew->prepare($groupsQ);
        $groupsStmt->execute([":empnum" => $empnum]);
        if ($groupsStmt->rowCount() > 0) {
            $groupArr = $groupsStmt->fetchAll();
            foreach ($groupArr as $grp) {
                array_push($myGroups, $grp);
            }
        }
    } else {
        $groupsQ = "SELECT `id`, `name`, `abbreviation` as `abbr` FROM `group_list` ORDER BY `abbreviation`";
        $groupsStmt = $connnew->prepare($groupsQ);
        $groupsStmt->execute();
        if ($groupsStmt->rowCount() > 0) {
            $groupArr = $groupsStmt->fetchAll();
            foreach ($groupArr as $grp) {
                array_push($myGroups, $grp);
            }
        }
    }
    return $myGroups;
}

function getKHIMembers($empnum)
{
    global $connpcs;
    $members = array();
    $myGroups = getGroups($empnum);
    $group_ids = array_map(function ($group) {
        return $group['id'];
    }, $myGroups);
    $grpStmt = "AND kd.`group_id` IN (" . implode(',', $group_ids) . ")";
    $memsQ = "SELECT kd.`number` ,kd.`surname`, kd.`firstname`, gl.`id`, gl.`abbreviation`, kd.`email` FROM `pcosdb`.`khi_details` AS kd JOIN `kdtphdb_new`.`group_list` AS gl ON kd.`group_id` = gl.`id` WHERE 
    kd.`is_active` = 1 $grpStmt ORDER BY `number`";
    $memsStmt = $connpcs->prepare($memsQ);
    $memsStmt->execute();
    if ($memsStmt->rowCount() > 0) {
        $memArr = $memsStmt->fetchAll();
        foreach ($memArr as $mem) {
            $output = array();
            $khi_id = $mem['number'];
            $khi_fname = $mem['firstname'];
            $khi_sname = $mem['surname'];
            $group_id = $mem['id'];
            $group_abbr = $mem['abbreviation'];
            $emp_email = $mem['email'];
            $adminType = allGroupAccess($khi_id) ? 1 : 0;
            $output['id'] = $khi_id;
            $output['fname'] = $khi_fname;
            $output['sname'] = $khi_sname;
            $output['group']['id'] = $group_id;
            $output['group']['abbr'] = $group_abbr;
            $output['type'] = $adminType;
            $output['email'] = $emp_email;
            array_push($members, $output);
        }
    }
    return $members;
}

function arraySort($a, $b)
{
    return strcmp($a["name"], $b["name"]);
}
function getID()
{
    $empID = 0;
    if (!empty($_SESSION["IDKHI"])) {
        $empID = $_SESSION["IDKHI"];
        $empID = hex2bin($empID);
        $empID = base64_decode(urldecode($empID));
    }
    return (int)$empID;
}
function getName($id)
{
    global $connnew;
    global $connpcs;
    $name = '';
    $newQ = "SELECT CONCAT(`surname`,', ',`firstname`) FROM `employee_list` WHERE `id`=:id";
    $newStmt = $connnew->prepare($newQ);
    $newStmt->execute([":id" => $id]);
    if ($newStmt->rowCount() > 0) {
        $name = $newStmt->fetchColumn();
    } else {
        $pcsQ = "SELECT CONCAT(`surname`,', ',`firstname`) FROM `khi_details` WHERE `number`=:id";
        $pcsStmt = $connpcs->prepare($pcsQ);
        $pcsStmt->execute([":id" => $id]);
        if ($pcsStmt->rowCount() > 0) {
            $name = $pcsStmt->fetchColumn();
        }
    }

    return ucwords(strtolower($name));
}
function getPresID()
{
    global $connnew;
    $idp = 0;
    $idQ = "SELECT `id` FROM `employee_list` WHERE `designation`=29 AND `resignation_date` < CURRENT_DATE()";
    $idStmt = $connnew->query($idQ);
    if ($idStmt->rowCount() > 0) {
        $idp = $idStmt->fetchColumn();
    }
    return (int)$idp;
}
function getPresEmail()
{
    global $connnew;
    $emailp = '';
    $emailQ = "SELECT `email` FROM `employee_list` WHERE `designation`=29 AND `resignation_date` < CURRENT_DATE()";
    $emailStmt = $connnew->query($emailQ);
    if ($emailStmt->rowCount() > 0) {
        $emailp = $emailStmt->fetchColumn();
    }
    return $emailp;
}
function getAdminEmails()
{
    global $connnew;
    $adminEmail = array();
    $exclude = [29, 40, 43, 44, 45, 49, 51, 53];
    $adminGroupID = 2;
    $excludeStmt = "AND `designation` NOT IN (" . implode(",", $exclude) . ")";
    $emailQ = "SELECT `email` FROM `employee_list` WHERE `group_id`=:group_id $excludeStmt";
    $emailStmt = $connnew->prepare($emailQ);
    $emailStmt->execute([":group_id" => $adminGroupID]);
    if ($emailStmt->rowCount() > 0) {
        $emailArr = $emailStmt->fetchAll();
        foreach ($emailArr as $emails) {
            $adminEmail[] = $emails['email'];
        }
    }
    return $adminEmail;
}
function groupByID($id)
{
    global $connnew;
    $grpID = 0;
    $grpQ = "SELECT `group_id` FROM `employee_list` WHERE `id`=:id";
    $grpStmt = $connnew->prepare($grpQ);
    $grpStmt->execute([":id" => $id]);
    if ($grpStmt->rowCount() > 0) {
        $grpID = $grpStmt->fetchColumn();
    }
    return $grpID;
}
function getKHIPICEmail($group_id, $exclude = 0)
{
    global $connpcs;
    $khiEmail = array();
    $khiQ = "SELECT `email` FROM `khi_details` WHERE `group_id`=:group_id AND `number` != :exclude";
    $khiStmt = $connpcs->prepare($khiQ);
    $khiStmt->execute([":group_id" => $group_id, ":exclude" => $exclude]);
    if ($khiStmt->rowCount() > 0) {
        $khiArr = $khiStmt->fetchAll();
        foreach ($khiArr as $emails) {
            $khiEmail[] = $emails['email'];
        }
    }
    return $khiEmail;
}
function countDays($start, $end)
{
    $date1 = date_create($start);
    $date2 = date_create($end);
    $diff = date_diff($date1, $date2);
    return  (int)$diff->format("%a") + 1;
}
#endregion
