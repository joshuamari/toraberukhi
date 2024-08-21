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
function getPresDetails()
{
    global $connnew;
    $presData = [];
    $dataQ = "SELECT `id`,`email`,`surname` FROM `employee_list` WHERE `designation`=29 AND `resignation_date` < CURRENT_DATE()";
    $dataStmt = $connnew->query($dataQ);
    if ($dataStmt->rowCount() > 0) {
        $presData = $dataStmt->fetch();
    }
    return $presData;
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
function getKHIAdminEmails()
{
    global $connpcs;
    $khiEmail = array();
    $khiQ = "SELECT `email` FROM `khi_details` WHERE `group_id`=2 AND `number` != 905007";
    $khiStmt = $connpcs->prepare($khiQ);
    $khiStmt->execute();
    if ($khiStmt->rowCount() > 0) {
        $khiArr = $khiStmt->fetchAll();
        foreach ($khiArr as $emails) {
            $khiEmail[] = $emails['email'];
        }
    }
    return $khiEmail;
}
function getRequestDetails($request_id)
{
    global $connpcs;
    $details = array();
    $detailsQ = "SELECT * FROM `request_list` WHERE `request_id`=:request_id";
    $detailsStmt = $connpcs->prepare($detailsQ);
    $detailsStmt->execute([":request_id" => $request_id]);
    $details = $detailsStmt->fetch();
    $details['emp_group'] = groupByID($details['emp_number']);
    return $details;
}
function getKHIUserDetails($id)
{
    global $connpcs;
    $khidetails = array();
    $khidQ = "SELECT `surname`,`email` FROM `khi_details` WHERE `number`=:id";
    $khidStmt = $connpcs->prepare($khidQ);
    $khidStmt->execute([":id" => $id]);
    $khidetails = $khidStmt->fetch();
    return $khidetails;
}
function getLocationName($id)
{
    global $connpcs;
    $name = '';
    $nameQ = "SELECT `location_name` FROM `location_list` WHERE `location_id`=:id";
    $nameStmt = $connpcs->prepare($nameQ);
    $nameStmt->execute([":id" => $id]);
    $name = $nameStmt->fetchColumn();
    return $name;
}
function emailRequest($details)
{
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: kdt_toraberu@global.kawasaki.com" . "\r\n";
    $subject = 'Dispatch Request Notification(TEST ONLY)';
    $khidetails = getKHIUserDetails($details['requester_id']);
    $presdata = getPresDetails();
    #region TESTING
    #region systesting
    $CCarray = array('medrano_c-kdt@global.kawasaki.com', 'hernandez-kdt@global.kawasaki.com', 'reyes_d-kdt@global.kawasaki.com', 'cabiso-kdt@global.kawasaki.com', 'coquia-kdt@global.kawasaki.com');
    $emails = array("coquia-kdt@global.kawasaki.com", "medrano_c-kdt@global.kawasaki.com");
    #endregion

    #region prekhitesting
    // $admins = array("sangalang_m-kdt@global.kawasaki.com"); //COMMENT PAG PROD
    // $khipic = getKHIPICEmail($details['emp_group']);
    // $khiAdmins = getKHIAdminEmails();
    // $kdtManagers = array("lazaro-kdt@global.kawasaki.com"); //COMMENT PAG PROD
    // $CCarray = array_unique(array_merge($khipic, $khiAdmins, $kdtManagers)); //UNCOMMENT PAG PROD
    // $emails = $admins; //UNCOMMENT PAG PROD
    // $emails[] = "hernandez-kdt@global.kawasaki.com"; //UNCOMMENT PAG PROD
    #endregion
    #endregion

    #region PROD
    // $admins = getAdminEmails();
    // $khipic = getKHIPICEmail($details['emp_group']);
    // $khiAdmins = getKHIAdminEmails();
    // $kdtManagers = getGroupManagersEmail($details['emp_group']);
    // $CCarray = array_unique(array_merge($khipic, $khiAdmins, $kdtManagers, $admins)); //UNCOMMENT PAG PROD
    // $emails[] = $presdata['email']; //UNCOMMENT PAG PROD
    #endregion
    $CC = implode(",", $CCarray);
    $email_to = implode(",", $emails);
    $headers .= "CC: " . $CC;
    $msg = "
                <html>
                <head>
                <title>Dispatch Request</title>
                </head>
                <body>
        <p>Dear President " . $presdata['surname'] . "-san,</p>
        <p>A new request has been submitted by " . ucwords(strtolower($khidetails['surname'])) . "-san.</p>
        <p>Details:</p>
        <p>Employee: " . getName($details['emp_number']) . "</p>
        <p>Date From: " . $details['dispatch_from'] . "</p>
        <p>Date To: " . $details['dispatch_to'] . "</p>
        <p>Location: " . getLocationName($details['location_id']) . "</p>
        <p>Date Requested: " . $details['date_requested'] . "</p>
        <br>
        <p>For <strong>KDT</strong>, take action for next procedure:</p>
        <ul>
            <li><a href='http://kdt-ph/PCS/requestList/'>Dispatch Request List</a></li>
        </ul>
        <p>For <strong>KHI</strong>, track the request status:</p>
        <ul>
            <li><a href='http://kdt-ph/PCSKHI/requestList/'>Track Request Status</a></li>
        </ul>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>トラベる<br>KHI Design & Technical Service, Inc.</p>
         <p style='margin-top: 20px; font-size: 12px; color: #999;'>Please do not reply to this email as it is system generated.</p>
                </body>
                </html>
            ";
    if (mail($email_to, $subject, $msg, $headers)) {
        return TRUE;
    } else {
        return FALSE;
    }

    // return true;
    //baguhin yung $CCarray pag prod na.
}
function countDays($start, $end)
{
    $date1 = date_create($start);
    $date2 = date_create($end);
    $diff = date_diff($date1, $date2);
    return  (int)$diff->format("%a") + 1;
}
function getWorkHistory($id)
{
    global $connpcs;
    $workHistory = array();
    $workQ = "SELECT * FROM `work_history` WHERE `emp_id`=:id ORDER BY `start_date`";
    $workStmt = $connpcs->prepare($workQ);
    $workStmt->execute([":id" => $id]);
    if ($workStmt->rowCount() > 0) {
        $workArr = $workStmt->fetchAll();
        foreach ($workArr as $work) {
            $output = array();
            $output['company_name'] = $work['comp_name'];
            $output['company_business'] = $work['comp_business'];
            $output['business_content'] = $work['business_cont'];
            $output['location'] = $work['work_loc'];
            $output['start_year'] = date("Y", strtotime($work['start_date']));
            $output['start_month'] = date("n", strtotime($work['start_date']));
            $output['end_year'] = !empty($work['end_date']) ? date("Y", strtotime($work['end_date'])) : null;
            $output['end_month'] = !empty($work['end_date']) ? date("n", strtotime($work['end_date'])) : null;
            $workHistory[] = $output;
        }
    }
    return $workHistory;
}
function getGroupManagersEmail($group_id)
{
    global $connnew;
    $matik = [19, 55]; //GM & SM
    $matikStmt = implode(",", $matik);
    $mgs = [17, 18]; //AM & DM
    $mgsStmt = implode(",", $mgs);
    $mgEmail = array();
    $emailQ = "SELECT DISTINCT `el`.email FROM `employee_list` el LEFT JOIN `employee_group` eg ON `el`.id=`eg`.employee_number WHERE (`el`.designation IN ($matikStmt) OR (`el`.designation IN ($mgsStmt) AND `eg`.group_id=:group_id)) AND (`el`.`resignation_date`>CURDATE() OR `el`.`resignation_date` IS NULL OR `el`.`resignation_date`='0000-00-00')";
    $emailStmt = $connnew->prepare($emailQ);
    $emailStmt->execute([":group_id" => $group_id]);
    if ($emailStmt->rowCount() > 0) {
        $mgArr = $emailStmt->fetchAll();
        foreach ($mgArr as $mg) {
            $mgEmail[] = $mg['email'];
        }
    }
    return $mgEmail;
}
function getAllowance($id)
{
    global $connpcs;
    $allowance = array();
    $allowanceQ = "SELECT `location_id`,`amount` FROM `allowance_list` WHERE `level_id` = IFNULL((SELECT `da`.level_id FROM `pcosdb`.designation_allowance da JOIN `kdtphdb_new`.employee_list el ON `da`.designation_id=`el`.designation WHERE el.id=:id),1)";
    $allowanceStmt = $connpcs->prepare($allowanceQ);
    $allowanceStmt->execute([":id" => $id]);
    if ($allowanceStmt->rowCount() > 0) {
        $allowance = $allowanceStmt->fetchAll();
    }
    return $allowance;
}
#endregion
