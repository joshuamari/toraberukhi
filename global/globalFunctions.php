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
function getKHIUserGroups($empID)
{
    global $connpcs;
    $groups = array();

    $groupQ = "SELECT gl.`id`, gl.`name`, gl.`abbreviation` AS `abbr`
               FROM `pcosdb`.`khi_user_groups` AS kug
               INNER JOIN `kdtphdb_new`.`group_list` AS gl
                   ON gl.`id` = kug.`group_id`
               WHERE kug.`user_id` = :empID
               ORDER BY kug.`id` ASC";

    $groupStmt = $connpcs->prepare($groupQ);
    $groupStmt->execute([":empID" => $empID]);

    if ($groupStmt->rowCount() > 0) {
        $groupArr = $groupStmt->fetchAll();
        foreach ($groupArr as $grp) {
            $groups[] = [
                "id" => $grp["id"],
                "name" => $grp["name"],
                "abbr" => $grp["abbr"]
            ];
        }
    }

    return $groups;
}
function getKHIMainGroup($empID)
{
    $groups = getKHIUserGroups($empID);

    if (!empty($groups)) {
        return $groups[0];
    }

    return null;
}
function getKHIMembers($empnum)
{
    global $connpcs;
    $members = array();

    $myGroups = getGroups($empnum);
    $group_ids = array_map(function ($group) {
        return (int)$group['id'];
    }, $myGroups);

    if (empty($group_ids)) {
        return $members;
    }

    $grpStmt = implode(',', $group_ids);

    $memsQ = "SELECT DISTINCT
                    kd.`number`,
                    kd.`surname`,
                    kd.`firstname`,
                    kd.`email`
              FROM `pcosdb`.`khi_details` AS kd
              INNER JOIN `pcosdb`.`khi_user_groups` AS kug
                  ON kd.`number` = kug.`user_id`
              WHERE kd.`is_active` = 1
                AND kug.`group_id` IN ($grpStmt)
              ORDER BY kd.`number`";

    $memsStmt = $connpcs->prepare($memsQ);
    $memsStmt->execute();

    if ($memsStmt->rowCount() > 0) {
        $memArr = $memsStmt->fetchAll();

        foreach ($memArr as $mem) {
            $output = array();

            $khi_id = $mem['number'];
            $khi_fname = $mem['firstname'];
            $khi_sname = $mem['surname'];
            $emp_email = $mem['email'];
            $adminType = allGroupAccess($khi_id) ? 1 : 0;

            $groupArray = getKHIUserGroups($khi_id);
            $mainGroup = getKHIMainGroup($khi_id);

            $output['id'] = $khi_id;
            $output['empID'] = $khi_id;
            $output['fname'] = $khi_fname;
            $output['sname'] = $khi_sname;
            $output['group'] = $mainGroup;
            $output['groups'] = $groupArray;
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

    $adminEmail = [];
    $exclude = [29, 40, 43, 44, 45, 49, 51, 53];
    $adminGroupID = 2;

    $excludeStmt = "AND `designation` NOT IN (" . implode(",", $exclude) . ")";

    $emailQ = "
        SELECT `email`
        FROM `employee_list`
        WHERE `group_id` = :group_id
        $excludeStmt
        AND (
            `resignation_date` IS NULL
            OR `resignation_date` = '0000-00-00'
            OR `resignation_date` >= CURDATE()
        )
    ";

    $emailStmt = $connnew->prepare($emailQ);
    $emailStmt->execute([":group_id" => $adminGroupID]);

    if ($emailStmt->rowCount() > 0) {
        $emailArr = $emailStmt->fetchAll(PDO::FETCH_ASSOC);
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

    $khiQ = "
        SELECT `email`
        FROM `khi_details`
        WHERE `group_id` = :group_id
          AND `number` != :exclude
          AND `is_active` = 1
    ";

    $khiStmt = $connpcs->prepare($khiQ);
    $khiStmt->execute([
        ":group_id" => $group_id,
        ":exclude" => $exclude
    ]);

    if ($khiStmt->rowCount() > 0) {
        $khiArr = $khiStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($khiArr as $emails) {
            if (!empty($emails['email'])) {
                $khiEmail[] = $emails['email'];
            }
        }
    }

    return $khiEmail;
}

function getKHIAdminEmails()
{
    global $connpcs;
    $khiEmail = array();

    $khiQ = "
        SELECT `email`
        FROM `khi_details`
        WHERE `group_id` = 2
          AND `number` != 905007
          AND `is_active` = 1
    ";

    $khiStmt = $connpcs->prepare($khiQ);
    $khiStmt->execute();

    if ($khiStmt->rowCount() > 0) {
        $khiArr = $khiStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($khiArr as $emails) {
            if (!empty($emails['email'])) {
                $khiEmail[] = $emails['email'];
            }
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
/**
 * When true, notification emails are redirected to developer inboxes only.
 * PROD recipient lists are still computed and appended in the email body for verification.
 * Set to false before production go-live.
 */
define('DISPATCH_EMAIL_TEST_MODE', true);

/**
 * Developer employee IDs.
 * - TEST mode: emails are redirected To these developers only
 * - PROD mode: these developers are BCC'd so delivery can be verified
 */
define('DISPATCH_EMAIL_DEV_IDS', [464, 487, 510]);

function getDispatchEmailDevEmails(): array
{
    global $connnew;
    $ids = DISPATCH_EMAIL_DEV_IDS;
    if (empty($ids)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $connnew->prepare(
        "SELECT `email` FROM `employee_list` WHERE `id` IN ($placeholders)"
    );
    $stmt->execute(array_values($ids));
    $emails = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'email');

    return array_values(array_unique(array_filter(array_map('trim', $emails))));
}

/**
 * Build To / CC / BCC recipients used by dispatch notification emails.
 * To: President; CC: KHI PIC, KHI admins, KDT managers, system admins.
 * BCC (PROD): developers, for delivery verification.
 *
 * In TEST mode, actual delivery is redirected to developer emails, while
 * prod_to / prod_cc retain the real recipient lists for inspection.
 *
 * @return array{to: string[], cc: string[], bcc: string[], prod_to: string[], prod_cc: string[], test_mode: bool, presdata: array, khidetails: array, link: string}
 */
function buildDispatchEmailRecipients(array $details): array
{
    $link = "https://kdt-ph.kdts.net";
    $khidetails = getKHIUserDetails($details['requester_id']);
    $presdata = getPresDetails();
    $group = ((int)($details['dept_id'] ?? 0) === 15)
        ? 21
        : (int)($details['emp_group'] ?? 0);
    $devEmails = getDispatchEmailDevEmails();

    #region PROD recipient resolution (always computed)
    $admins = getAdminEmails();
    $khipic = getKHIPICEmail($group);
    $khiAdmins = getKHIAdminEmails();
    $kdtManagers = getGroupManagersEmail($group);
    $prodCc = array_values(array_unique(array_filter(array_merge($khipic, $khiAdmins, $kdtManagers, $admins))));
    $prodTo = [];
    if (!empty($presdata['email'])) {
        $prodTo[] = $presdata['email'];
    }
    #endregion

    $to = $prodTo;
    $cc = $prodCc;
    $bcc = [];
    $testMode = defined('DISPATCH_EMAIL_TEST_MODE') && DISPATCH_EMAIL_TEST_MODE;

    if ($testMode) {
        $to = $devEmails;
        $cc = [];
        $bcc = [];
    } else {
        // PROD: BCC developers so we can confirm the mail was sent.
        $visible = array_map('strtolower', array_merge($to, $cc));
        $bcc = array_values(array_filter(
            $devEmails,
            static fn($email) => !in_array(strtolower((string)$email), $visible, true)
        ));
    }

    return [
        "to" => array_values(array_filter($to)),
        "cc" => array_values(array_filter($cc)),
        "bcc" => array_values(array_filter($bcc)),
        "prod_to" => $prodTo,
        "prod_cc" => $prodCc,
        "test_mode" => $testMode,
        "presdata" => $presdata,
        "khidetails" => is_array($khidetails) ? $khidetails : [],
        "link" => $link,
    ];
}

function buildDispatchEmailTestRecipientFooter(array $recipients): string
{
    if (empty($recipients['test_mode'])) {
        return '';
    }

    $escapeList = static function (array $emails): string {
        if (empty($emails)) {
            return '<em>(none)</em>';
        }
        return htmlspecialchars(implode(', ', $emails), ENT_QUOTES, 'UTF-8');
    };

    $actualTo = $escapeList($recipients['to'] ?? []);
    $prodTo = $escapeList($recipients['prod_to'] ?? []);
    $prodCc = $escapeList($recipients['prod_cc'] ?? []);

    return "
        <hr style='margin-top: 28px; border: none; border-top: 1px solid #ccc;'>
        <div style='margin-top: 12px; padding: 12px; background: #fff8e1; border: 1px solid #f0c36d; font-size: 12px; color: #333;'>
            <p style='margin: 0 0 8px 0;'><strong>[TEST MODE]</strong> This email was redirected to developers only. Real recipients were NOT notified.</p>
            <p style='margin: 0 0 4px 0;'><strong>Actually sent To:</strong> {$actualTo}</p>
            <p style='margin: 0 0 4px 0;'><strong>PROD would To:</strong> {$prodTo}</p>
            <p style='margin: 0;'><strong>PROD would CC:</strong> {$prodCc}</p>
        </div>
    ";
}

function sendDispatchNotificationEmail(string $subject, string $msg, array $recipients): bool
{
    $emailTo = implode(",", $recipients["to"] ?? []);
    if ($emailTo === "") {
        return false;
    }

    if (!empty($recipients['test_mode'])) {
        $subject = '[TEST] ' . $subject;
        $msg .= buildDispatchEmailTestRecipientFooter($recipients);
    }

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: kdt_toraberu@global.kawasaki.com" . "\r\n";

    $cc = implode(",", $recipients["cc"] ?? []);
    if ($cc !== "") {
        $headers .= "CC: " . $cc . "\r\n";
    }

    $bcc = implode(",", $recipients["bcc"] ?? []);
    if ($bcc !== "") {
        $headers .= "Bcc: " . $bcc . "\r\n";
    }

    return mail($emailTo, $subject, $msg, $headers);
}

function emailRequest($details)
{
    $recipients = buildDispatchEmailRecipients($details);
    $presdata = $recipients["presdata"];
    $khidetails = $recipients["khidetails"];
    $link = $recipients["link"];
    $subject = 'Dispatch Request Notification';
    $msg = "
                <html>
                <head>
                <title>Dispatch Request</title>
                </head>
                <body>
        <p>Dear President " . ($presdata['surname'] ?? '') . "-san,</p>
        <p>A new request has been submitted by " . ucwords(strtolower((string)($khidetails['surname'] ?? ''))) . "-san.</p>
        <p>Details:</p>
        <p>Employee: " . getName($details['emp_number']) . "</p>
        <p>Date From: " . $details['dispatch_from'] . "</p>
        <p>Date To: " . $details['dispatch_to'] . "</p>
        <p>Location: " . getLocationName($details['location_id']) . "</p>
        <p>Date Requested: " . $details['date_requested'] . "</p>
        <br>
        <p>For <strong>KDT</strong>, take action for next procedure:</p>
        <ul>
            <li><a href='$link/PCS/requestList/'>Dispatch Request List</a></li>
        </ul>
        <p>For <strong>KHI</strong>, track the request status:</p>
        <ul>
            <li><a href='$link/PCSKHI/requestList/'>Track Request Status</a></li>
        </ul>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>トラベる<br>KHI Design & Technical Service, Inc.</p>
         <p style='margin-top: 20px; font-size: 12px; color: #999;'>Please do not reply to this email as it is system generated.</p>
                </body>
                </html>
            ";

    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function emailDateChangeRequest(array $details, array $changeData): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $presdata = $recipients["presdata"];
    $khidetails = $recipients["khidetails"];
    $link = $recipients["link"];
    $subject = 'Dispatch Date Change Request Notification';
    $originalFrom = $changeData['original_start_date'] ?? $details['dispatch_from'];
    $originalTo = $changeData['original_end_date'] ?? $details['dispatch_to'];
    $proposedFrom = $changeData['requested_start_date'] ?? '';
    $proposedTo = $changeData['requested_end_date'] ?? '';
    $reason = htmlspecialchars((string)($changeData['reason'] ?? ''), ENT_QUOTES, 'UTF-8');
    $msg = "
                <html>
                <head>
                <title>Dispatch Date Change Request</title>
                </head>
                <body>
        <p>Dear President " . ($presdata['surname'] ?? '') . "-san,</p>
        <p>A date change request has been submitted by " . ucwords(strtolower((string)($khidetails['surname'] ?? ''))) . "-san.</p>
        <p>Details:</p>
        <p>Employee: " . getName($details['emp_number']) . "</p>
        <p>Current Date From: " . $originalFrom . "</p>
        <p>Current Date To: " . $originalTo . "</p>
        <p>Proposed Date From: " . $proposedFrom . "</p>
        <p>Proposed Date To: " . $proposedTo . "</p>
        <p>Location: " . getLocationName($details['location_id']) . "</p>
        <p>Reason: " . $reason . "</p>
        <br>
        <p>For <strong>KDT</strong>, take action for next procedure:</p>
        <ul>
            <li><a href='$link/PCS/changeRequests/'>Change Request List</a></li>
        </ul>
        <p>For <strong>KHI</strong>, track the request status:</p>
        <ul>
            <li><a href='$link/PCSKHI/changeRequests/'>Track Change Request Status</a></li>
        </ul>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>トラベる<br>KHI Design & Technical Service, Inc.</p>
         <p style='margin-top: 20px; font-size: 12px; color: #999;'>Please do not reply to this email as it is system generated.</p>
                </body>
                </html>
            ";

    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function emailCancellationRequest(array $details, array $changeData = []): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $presdata = $recipients["presdata"];
    $khidetails = $recipients["khidetails"];
    $link = $recipients["link"];
    $subject = 'Dispatch Cancellation Request Notification';
    $reason = htmlspecialchars((string)($changeData['reason'] ?? ''), ENT_QUOTES, 'UTF-8');
    $msg = "
                <html>
                <head>
                <title>Dispatch Cancellation Request</title>
                </head>
                <body>
        <p>Dear President " . ($presdata['surname'] ?? '') . "-san,</p>
        <p>A cancellation request has been submitted by " . ucwords(strtolower((string)($khidetails['surname'] ?? ''))) . "-san.</p>
        <p>Details:</p>
        <p>Employee: " . getName($details['emp_number']) . "</p>
        <p>Date From: " . $details['dispatch_from'] . "</p>
        <p>Date To: " . $details['dispatch_to'] . "</p>
        <p>Location: " . getLocationName($details['location_id']) . "</p>
        <p>Reason: " . $reason . "</p>
        <br>
        <p>For <strong>KDT</strong>, take action for next procedure:</p>
        <ul>
            <li><a href='$link/PCS/changeRequests/'>Change Request List</a></li>
        </ul>
        <p>For <strong>KHI</strong>, track the request status:</p>
        <ul>
            <li><a href='$link/PCSKHI/changeRequests/'>Track Change Request Status</a></li>
        </ul>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>トラベる<br>KHI Design & Technical Service, Inc.</p>
         <p style='margin-top: 20px; font-size: 12px; color: #999;'>Please do not reply to this email as it is system generated.</p>
                </body>
                </html>
            ";

    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function emailChangeRequestWithdrawn(array $details, array $changeData): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $presdata = $recipients["presdata"];
    $khidetails = $recipients["khidetails"];
    $link = $recipients["link"];

    $changeType = strtolower(trim((string)($changeData['change_type'] ?? '')));
    $isCancellation = $changeType === 'cancellation';
    $typeLabel = $isCancellation ? 'cancellation' : 'date change';
    $typeTitle = $isCancellation ? 'Cancellation' : 'Date Change';
    $subject = "Dispatch {$typeTitle} Request Withdrawn";
    $reason = htmlspecialchars((string)($changeData['reason'] ?? ''), ENT_QUOTES, 'UTF-8');

    $extraDetails = '';
    if ($isCancellation) {
        $extraDetails = "
        <p>Date From: " . $details['dispatch_from'] . "</p>
        <p>Date To: " . $details['dispatch_to'] . "</p>";
    } else {
        $originalFrom = $changeData['original_start_date'] ?? $details['dispatch_from'];
        $originalTo = $changeData['original_end_date'] ?? $details['dispatch_to'];
        $proposedFrom = $changeData['requested_start_date'] ?? '';
        $proposedTo = $changeData['requested_end_date'] ?? '';
        $extraDetails = "
        <p>Current Date From: " . $originalFrom . "</p>
        <p>Current Date To: " . $originalTo . "</p>
        <p>Proposed Date From: " . $proposedFrom . "</p>
        <p>Proposed Date To: " . $proposedTo . "</p>";
    }

    $msg = "
                <html>
                <head>
                <title>Dispatch {$typeTitle} Request Withdrawn</title>
                </head>
                <body>
        <p>Dear President " . ($presdata['surname'] ?? '') . "-san,</p>
        <p>A {$typeLabel} request has been withdrawn by " . ucwords(strtolower((string)($khidetails['surname'] ?? ''))) . "-san.</p>
        <p>Details:</p>
        <p>Employee: " . getName($details['emp_number']) . "</p>
        {$extraDetails}
        <p>Location: " . getLocationName($details['location_id']) . "</p>
        <p>Reason: " . $reason . "</p>
        <br>
        <p>For <strong>KDT</strong>, review the request list:</p>
        <ul>
            <li><a href='$link/PCS/changeRequests/'>Change Request List</a></li>
        </ul>
        <p>For <strong>KHI</strong>, track the request status:</p>
        <ul>
            <li><a href='$link/PCSKHI/changeRequests/'>Track Change Request Status</a></li>
        </ul>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>トラベる<br>KHI Design & Technical Service, Inc.</p>
         <p style='margin-top: 20px; font-size: 12px; color: #999;'>Please do not reply to this email as it is system generated.</p>
                </body>
                </html>
            ";

    return sendDispatchNotificationEmail($subject, $msg, $recipients);
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
function getCompanyByDept($dept_id)
{
    global $connpcs;
    $comp_id = 0;
    $compQ = "SELECT `comp_id` FROM requesters_dep WHERE `id`=:dept_id";
    $compStmt = $connpcs->prepare($compQ);
    $compStmt->execute([":dept_id" => $dept_id]);
    if ($compStmt->rowCount() > 0) {
        $comp_id = $compStmt->fetchColumn();
    }
    return $comp_id;
}
function getCompanyDetails($comp_id)
{
    global $connpcs;
    $company_details = [
        "company_name" => "",
        "company_jap" => "",
        "company_desc" => ""
    ];
    $compQ = "SELECT * FROM `company_list` WHERE `id`=:comp_id";
    $compStmt = $connpcs->prepare($compQ);
    $compStmt->execute([":comp_id" => $comp_id]);
    if ($compStmt->rowCount() > 0) {
        $company_details = $compStmt->fetch();
    }
    return $company_details;
}
#endregion
