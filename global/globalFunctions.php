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
    $memArr = $memsStmt->fetchAll();

    if (empty($memArr)) {
        return $members;
    }

    $memberIds = array_values(array_unique(array_map(function ($mem) {
        return (int)$mem['number'];
    }, $memArr)));
    $memberIdList = implode(',', $memberIds);

    $groupsByUser = array();
    $groupsQ = "SELECT kug.`user_id`, gl.`id`, gl.`name`, gl.`abbreviation` AS `abbr`
                FROM `pcosdb`.`khi_user_groups` AS kug
                INNER JOIN `kdtphdb_new`.`group_list` AS gl
                    ON gl.`id` = kug.`group_id`
                WHERE kug.`user_id` IN ($memberIdList)
                ORDER BY kug.`id` ASC";
    $groupsStmt = $connpcs->prepare($groupsQ);
    $groupsStmt->execute();
    foreach ($groupsStmt->fetchAll() as $grp) {
        $uid = (int)$grp['user_id'];
        if (!isset($groupsByUser[$uid])) {
            $groupsByUser[$uid] = array();
        }
        $groupsByUser[$uid][] = [
            "id" => $grp["id"],
            "name" => $grp["name"],
            "abbr" => $grp["abbr"]
        ];
    }

    $adminIds = array();
    $permQ = "SELECT `employee_id`
              FROM `khi_user_permissions`
              WHERE `permission_id` = 1
                AND `employee_id` IN ($memberIdList)";
    $permStmt = $connpcs->prepare($permQ);
    $permStmt->execute();
    foreach ($permStmt->fetchAll() as $row) {
        $adminIds[(int)$row['employee_id']] = true;
    }

    foreach ($memArr as $mem) {
        $khi_id = $mem['number'];
        $groupArray = isset($groupsByUser[(int)$khi_id]) ? $groupsByUser[(int)$khi_id] : array();

        $members[] = [
            'id' => $khi_id,
            'empID' => $khi_id,
            'fname' => $mem['firstname'],
            'sname' => $mem['surname'],
            'group' => !empty($groupArray) ? $groupArray[0] : null,
            'groups' => $groupArray,
            'type' => isset($adminIds[(int)$khi_id]) ? 1 : 0,
            'email' => $mem['email'],
        ];
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
    // Active president only (designation 29). Do not use resigned records.
    $dataQ = "
        SELECT `id`, `email`, `surname`
        FROM `employee_list`
        WHERE `designation` = 29
          AND (
                `resignation_date` IS NULL
                OR `resignation_date` = '0000-00-00'
                OR `resignation_date` > CURDATE()
              )
        LIMIT 1
    ";
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
function getGroupAbbreviation($groupId)
{
    global $connnew;
    $groupId = (int)$groupId;
    if ($groupId <= 0) {
        return '';
    }
    $grpQ = "SELECT `abbreviation` FROM `group_list` WHERE `id` = :id LIMIT 1";
    $grpStmt = $connnew->prepare($grpQ);
    $grpStmt->execute([":id" => $groupId]);
    $abbr = $grpStmt->fetchColumn();
    return $abbr !== false ? (string)$abbr : '';
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
        <table role='presentation' width='100%' cellpadding='0' cellspacing='0' border='0' bgcolor='#F9F9F9' style='margin: 0 0 28px 0; border-collapse: separate; background-color: #F9F9F9; border: 1px solid #E9E9E9; border-radius: 10px;'>
            <tr>
                <td bgcolor='#F9F9F9' style='padding: 14px 16px; background-color: #F9F9F9; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 15px; color: #7D7D7D; word-break: break-word; overflow-wrap: anywhere;'>
                    <strong style='color: #000000;'>[TEST MODE]</strong>
                    This email was redirected to developers only. Real recipients were NOT notified.
                    <br><br>
                    <strong style='color: #000000;'>Actually sent To:</strong> {$actualTo}
                    <br>
                    <strong style='color: #000000;'>PROD would To:</strong> {$prodTo}
                    <br>
                    <strong style='color: #000000;'>PROD would CC:</strong> {$prodCc}
                </td>
            </tr>
        </table>
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
        $testFooter = buildDispatchEmailTestRecipientFooter($recipients);
        if (strpos($msg, '<!--DISPATCH_EMAIL_TEST_MODE-->') !== false) {
            $msg = str_replace('<!--DISPATCH_EMAIL_TEST_MODE-->', $testFooter, $msg);
        } else {
            $msg .= $testFooter;
        }
    } else {
        $msg = str_replace('<!--DISPATCH_EMAIL_TEST_MODE-->', '', $msg);
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

function buildDispatchRequestSubmittedEmailHtml(array $details, array $recipients): string
{
    $presdata = $recipients["presdata"] ?? [];
    $khidetails = $recipients["khidetails"] ?? [];
    $link = (string)($recipients["link"] ?? 'https://kdt-ph.kdts.net');

    $escape = static function ($value): string {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    };
    $formatEmailDate = static function ($date) use ($escape): string {
        $raw = trim((string)$date);
        if ($raw === '') {
            return '';
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $escape($raw);
        }
        return $escape(date('d M Y', $ts));
    };

    $presidentSurname = $escape($presdata['surname'] ?? '');
    $requesterSurname = $escape(ucwords(strtolower((string)($khidetails['surname'] ?? ''))));
    $employeeName = $escape(getName($details['emp_number']));
    $requesterName = $escape(getName($details['requester_id'] ?? 0));
    $locationName = $escape(getLocationName($details['location_id']));
    $groupAbbr = $escape(getGroupAbbreviation($details['emp_group'] ?? 0));
    $dispatchFrom = $formatEmailDate($details['dispatch_from'] ?? '');
    $dispatchTo = $formatEmailDate($details['dispatch_to'] ?? '');
    $dispatchDates = trim($dispatchFrom . ($dispatchFrom !== '' && $dispatchTo !== '' ? ' — ' : '') . $dispatchTo);

    $requestId = (int)($details['request_id'] ?? 0);
    $requestRef = $requestId > 0
        ? 'REQ-' . str_pad((string)$requestId, 5, '0', STR_PAD_LEFT)
        : '';
    $requestRefEscaped = $escape($requestRef);

    $kdtCtaUrl = $escape($link . '/PCS/requestList/');
    $khiCtaUrl = $requestId > 0
        ? $escape($link . '/PCSKHI/requestList/?request_id=' . $requestId)
        : $escape($link . '/PCSKHI/requestList/');
    $logoUrl = $escape($link) . '/PCSKHI/images/' . rawurlencode('pcs logo bold.png');

    $requestIdBadge = $requestRefEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4ADE80;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$requestRefEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";

    return "
<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>Dispatch Request Submitted</title>
</head>
<body style=\"margin:0;padding:0;background-color:#F9F9F9;color:#000000;\">
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:collapse;background-color:#F9F9F9;width:100%;\">
    <tr>
        <td align=\"center\" bgcolor=\"#F9F9F9\" style=\"padding:24px 12px;background-color:#F9F9F9;\">
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;font-family:Arial, Helvetica, sans-serif;\">
                <tr>
                    <td style=\"padding:28px 34px 24px 34px;border-bottom:1px solid #E9E9E9;\">
                        <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"128\" style=\"display:block;width:128px;max-width:100%;height:auto;border:0;\">
                    </td>
                </tr>
                <tr>
                    <td style=\"padding:30px 34px 26px 34px;\">
                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                            <tr>
                                <td style=\"font-size:32px;line-height:34px;font-weight:700;color:#000000;padding:0;\">
                                    Dispatch<br>Request Submitted
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:48px;\">
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 16px 0;\">Dear President {$presidentSurname}-san,</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 16px 0;\"><strong>{$requesterSurname}-san</strong> has submitted a dispatch request for the employee below.</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0;\">Please review the proposed schedule and approve or decline the dispatch request.</td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:28px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td colspan=\"2\" bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 10px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">Dispatch Request Summary</td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">NAME</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">{$employeeName}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">REQUEST ID</div>
                                    <div style=\"line-height:1.45;\">{$requestIdBadge}</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">GROUP</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($groupAbbr !== '' ? $groupAbbr : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">LOCATION</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($locationName !== '' ? $locationName : '—') . "</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 16px 16px;border-right:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DISPATCH DATES</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($dispatchDates !== '' ? $dispatchDates : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 16px 14px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">REQUESTER</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($requesterName !== '' ? $requesterName : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:36px;\">
                            <tr>
                                <td>
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-right:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:9px;line-height:12px;font-weight:700;color:#959595;\">FOR KDT</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#000000\" style=\"background-color:#000000;border-radius:6px;\">
                                                            <a href=\"{$kdtCtaUrl}\" style=\"display:block;padding:14px 10px;font-family:Arial, Helvetica, sans-serif;font-size:11px;line-height:15px;font-weight:500;color:#FFFFFF;text-decoration:none;text-align:center;\">Review Dispatch Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-left:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:9px;line-height:12px;font-weight:700;color:#959595;\">FOR KHI</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#4ADE80\" style=\"background-color:#4ADE80;border-radius:6px;\">
                                                            <a href=\"{$khiCtaUrl}\" style=\"display:block;padding:14px 10px;font-family:Arial, Helvetica, sans-serif;font-size:11px;line-height:15px;font-weight:600;color:#000000;text-decoration:none;text-align:center;\">View Request Status&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td style=\"padding:0;\">
                                    <!--DISPATCH_EMAIL_TEST_MODE-->
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#E8E8E8\" style=\"border-collapse:separate;width:100%;margin-top:0;background-color:#E8E8E8;border-radius:9px;\">
                            <tr>
                                <td width=\"42\" valign=\"middle\" bgcolor=\"#E8E8E8\" style=\"width:42px;padding:13px 0 13px 15px;background-color:#E8E8E8;\">
                                    <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;\">
                                        <tr>
                                            <td align=\"center\" valign=\"middle\" style=\"width:18px;height:18px;border:1px solid #959595;border-radius:50%;color:#878787;font-size:11px;line-height:18px;font-weight:700;\">i</td>
                                        </tr>
                                    </table>
                                </td>
                                <td bgcolor=\"#E8E8E8\" style=\"padding:12px 15px 12px 4px;font-size:9px;line-height:13px;color:#959595;background-color:#E8E8E8;\">
                                    This is a system-generated email. Please do not reply to this message.
                                    If you need assistance, contact your トラべる administrator.
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:24px;\">
                            <tr>
                                <td>
                                    <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"84\" style=\"display:block;width:84px;max-width:100%;height:auto;border:0;\">
                                    <div style=\"margin-top:9px;font-size:9px;line-height:12px;color:#7D7D7D;\">KHI Design &amp; Technical Service, Inc.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
";
}

function emailRequest($details)
{
    $recipients = buildDispatchEmailRecipients($details);
    $subject = 'Dispatch Request Notification';
    $msg = buildDispatchRequestSubmittedEmailHtml($details, $recipients);
    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function buildDateChangeRequestSubmittedEmailHtml(array $details, array $changeData, array $recipients): string
{
    $presdata = $recipients["presdata"] ?? [];
    $khidetails = $recipients["khidetails"] ?? [];
    $link = (string)($recipients["link"] ?? 'https://kdt-ph.kdts.net');

    $escape = static function ($value): string {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    };
    $formatEmailDate = static function ($date) use ($escape): string {
        $raw = trim((string)$date);
        if ($raw === '') {
            return '';
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $escape($raw);
        }
        return $escape(date('d M Y', $ts));
    };
    $formatNetChangeValue = static function (int $currentDays, int $proposedDays): string {
        // Same day-diff calculation used by formatNetChangeDays() in change-request APIs.
        $diff = $proposedDays - $currentDays;
        if ($diff === 0) {
            return '0';
        }
        if ($diff > 0) {
            return '+' . $diff;
        }
        return (string)$diff;
    };

    $presidentSurname = $escape($presdata['surname'] ?? '');
    $requesterSurname = $escape(ucwords(strtolower((string)($khidetails['surname'] ?? ''))));
    $employeeName = $escape(getName($details['emp_number']));
    $locationName = $escape(getLocationName($details['location_id']));
    $groupAbbr = $escape(getGroupAbbreviation($details['emp_group'] ?? 0));

    $originalFromRaw = $changeData['original_start_date'] ?? $details['dispatch_from'] ?? '';
    $originalToRaw = $changeData['original_end_date'] ?? $details['dispatch_to'] ?? '';
    $proposedFromRaw = $changeData['requested_start_date'] ?? '';
    $proposedToRaw = $changeData['requested_end_date'] ?? '';
    $reason = $escape($changeData['reason'] ?? '');

    $originalFrom = $formatEmailDate($originalFromRaw);
    $originalTo = $formatEmailDate($originalToRaw);
    $proposedFrom = $formatEmailDate($proposedFromRaw);
    $proposedTo = $formatEmailDate($proposedToRaw);
    $dispatchDates = trim($originalFrom . ($originalFrom !== '' && $originalTo !== '' ? ' — ' : '') . $originalTo);
    $currentDates = trim($originalFrom . ($originalFrom !== '' && $originalTo !== '' ? ' - ' : '') . $originalTo);
    $proposedDates = trim($proposedFrom . ($proposedFrom !== '' && $proposedTo !== '' ? ' - ' : '') . $proposedTo);

    $currentDays = ($originalFromRaw !== '' && $originalToRaw !== '')
        ? countDays($originalFromRaw, $originalToRaw)
        : 0;
    $proposedDays = ($proposedFromRaw !== '' && $proposedToRaw !== '')
        ? countDays($proposedFromRaw, $proposedToRaw)
        : 0;
    $netChange = $formatNetChangeValue((int)$currentDays, (int)$proposedDays);

    $dispatchRequestId = (int)($details['request_id'] ?? 0);
    $dispatchRef = $dispatchRequestId > 0
        ? 'REQ-' . str_pad((string)$dispatchRequestId, 5, '0', STR_PAD_LEFT)
        : '';
    $dispatchRefEscaped = $escape($dispatchRef);

    $changeRequestId = (int)($changeData['change_request_id'] ?? 0);
    $changeDisplayId = trim((string)($changeData['display_id'] ?? ''));
    if ($changeDisplayId === '' && $changeRequestId > 0) {
        $changeDisplayId = 'DCR-' . str_pad((string)$changeRequestId, 5, '0', STR_PAD_LEFT);
    }
    $changeDisplayIdEscaped = $escape($changeDisplayId);

    $deepLinkQuery = 'type=date_change&openChangeRequestId=' . rawurlencode((string)$changeRequestId);
    $kdtCtaUrl = $escape($link . '/PCS/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $khiCtaUrl = $escape($link . '/PCSKHI/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $logoUrl = $escape($link) . '/PCSKHI/images/' . rawurlencode('pcs logo bold.png');

    $dcBadge = $changeDisplayIdEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4F39F6;color:#FFFFFF;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$changeDisplayIdEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";
    $reqBadge = $dispatchRefEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4ADE80;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$dispatchRefEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";

    return "
<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>Date Change Request Submitted</title>
</head>
<body style=\"margin:0;padding:0;background-color:#F9F9F9;color:#000000;\">
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:collapse;background-color:#F9F9F9;width:100%;\">
    <tr>
        <td align=\"center\" bgcolor=\"#F9F9F9\" style=\"padding:24px 12px;background-color:#F9F9F9;\">
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;font-family:Arial, Helvetica, sans-serif;\">
                <tr>
                    <td style=\"padding:28px 34px 24px 34px;border-bottom:1px solid #E9E9E9;\">
                        <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"128\" style=\"display:block;width:128px;max-width:100%;height:auto;border:0;\">
                    </td>
                </tr>
                <tr>
                    <td style=\"padding:30px 34px 26px 34px;\">
                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                            <tr>
                                <td style=\"font-size:32px;line-height:34px;font-weight:700;color:#000000;padding:0;\">
                                    Date Change<br>Request Submitted
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:36px;\">
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\">Dear President {$presidentSurname}-san,</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\"><strong>{$requesterSurname}-san</strong> has submitted a request to change the approved dispatch dates shown below.</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0;\">Please review the proposed schedule and approve or decline the request.</td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:28px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td colspan=\"2\" bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 10px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">Date Change Request Summary</td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">NAME</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">{$employeeName}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">LOCATION</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($locationName !== '' ? $locationName : '—') . "</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DATE CHANGE REQUEST ID</div>
                                    <div style=\"line-height:1.45;\">{$dcBadge}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">ORIGINAL DISPATCH ID</div>
                                    <div style=\"line-height:1.45;\">{$reqBadge}</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 16px 16px;border-right:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">GROUP</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($groupAbbr !== '' ? $groupAbbr : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 16px 14px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DISPATCH DATES</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($dispatchDates !== '' ? $dispatchDates : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 12px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;background-color:#F9F9F9;\">Schedule Comparison</td>
                            </tr>
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:0 12px 14px 12px;background-color:#F9F9F9;\">
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"44%\" valign=\"middle\" style=\"width:44%;\">
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:separate;width:100%;background-color:#FFFFFF;border:1px solid #E9E9E9;border-radius:10px;\">
                                                    <tr>
                                                        <td bgcolor=\"#FFFFFF\" style=\"padding:12px 12px 14px 12px;background-color:#FFFFFF;\">
                                                            <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">CURRENT</div>
                                                            <div style=\"font-size:12px;line-height:17px;font-weight:700;color:#000000;word-break:break-word;margin:0 0 8px 0;\">" . ($currentDates !== '' ? $currentDates : '—') . "</div>
                                                            <div style=\"font-size:12px;line-height:16px;font-weight:700;color:#38B365;\">{$currentDays} days</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"12%\" align=\"center\" valign=\"middle\" style=\"width:12%;padding:0 4px;font-size:22px;line-height:22px;font-weight:700;color:#2EAD5C;\">→</td>
                                            <td width=\"44%\" valign=\"middle\" style=\"width:44%;\">
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:separate;width:100%;background-color:#FFFFFF;border:1px solid #E9E9E9;border-radius:10px;\">
                                                    <tr>
                                                        <td bgcolor=\"#FFFFFF\" style=\"padding:12px 12px 14px 12px;background-color:#FFFFFF;\">
                                                            <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">PROPOSED</div>
                                                            <div style=\"font-size:12px;line-height:17px;font-weight:700;color:#000000;word-break:break-word;margin:0 0 8px 0;\">" . ($proposedDates !== '' ? $proposedDates : '—') . "</div>
                                                            <div style=\"font-size:12px;line-height:16px;font-weight:700;color:#38B365;\">{$proposedDays} days</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:0 16px 16px 16px;background-color:#F9F9F9;\">
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;border-top:1px solid #E9E9E9;\">
                                        <tr>
                                            <td style=\"padding:12px 0 0 0;font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;\">NET CHANGE</td>
                                            <td align=\"right\" style=\"padding:12px 0 0 0;font-size:14px;line-height:16px;font-weight:700;color:#38B365;\">{$netChange}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:12px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:14px 16px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">REASON FOR DATE CHANGE</div>
                                    <div style=\"font-size:13px;line-height:20px;color:#000000;word-break:break-word;\">" . ($reason !== '' ? $reason : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td>
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-right:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KDT</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#000000\" style=\"background-color:#000000;border-radius:8px;\">
                                                            <a href=\"{$kdtCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#FFFFFF;text-decoration:none;text-align:center;border-radius:8px;\">View Date Change Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-left:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KHI</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#4ADE80\" style=\"background-color:#4ADE80;border-radius:8px;\">
                                                            <a href=\"{$khiCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#000000;text-decoration:none;text-align:center;border-radius:8px;\">View Request Status&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td style=\"padding:0;\">
                                    <!--DISPATCH_EMAIL_TEST_MODE-->
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#E8E8E8\" style=\"border-collapse:separate;width:100%;margin-top:0;background-color:#E8E8E8;border-radius:9px;\">
                            <tr>
                                <td width=\"42\" valign=\"middle\" bgcolor=\"#E8E8E8\" style=\"width:42px;padding:13px 0 13px 15px;background-color:#E8E8E8;\">
                                    <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;\">
                                        <tr>
                                            <td align=\"center\" valign=\"middle\" style=\"width:18px;height:18px;border:1px solid #959595;border-radius:50%;color:#878787;font-size:11px;line-height:18px;font-weight:700;\">i</td>
                                        </tr>
                                    </table>
                                </td>
                                <td bgcolor=\"#E8E8E8\" style=\"padding:12px 15px 12px 4px;font-size:11px;line-height:16px;color:#7D7D7D;background-color:#E8E8E8;\">
                                    This is a system-generated email. Please do not reply to this message.<br>
                                    If you need assistance, contact your トラべる administrator.
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:24px;\">
                            <tr>
                                <td>
                                    <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"84\" style=\"display:block;width:84px;max-width:100%;height:auto;border:0;\">
                                    <div style=\"margin-top:9px;font-size:11px;line-height:14px;color:#7D7D7D;\">KHI Design &amp; Technical Service, Inc.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
";
}

function emailDateChangeRequest(array $details, array $changeData): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $subject = 'Dispatch Date Change Request Notification';
    $msg = buildDateChangeRequestSubmittedEmailHtml($details, $changeData, $recipients);
    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function buildCancellationRequestSubmittedEmailHtml(array $details, array $changeData, array $recipients): string
{
    $presdata = $recipients["presdata"] ?? [];
    $khidetails = $recipients["khidetails"] ?? [];
    $link = (string)($recipients["link"] ?? 'https://kdt-ph.kdts.net');

    $escape = static function ($value): string {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    };
    $formatEmailDate = static function ($date) use ($escape): string {
        $raw = trim((string)$date);
        if ($raw === '') {
            return '';
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $escape($raw);
        }
        return $escape(date('d M Y', $ts));
    };

    $presidentSurname = $escape($presdata['surname'] ?? '');
    $requesterSurname = $escape(ucwords(strtolower((string)($khidetails['surname'] ?? ''))));
    $employeeName = $escape(getName($details['emp_number']));
    $locationName = $escape(getLocationName($details['location_id']));
    $groupAbbr = $escape(getGroupAbbreviation($details['emp_group'] ?? 0));
    $reason = $escape($changeData['reason'] ?? '');

    $dispatchFromRaw = $changeData['original_start_date'] ?? $details['dispatch_from'] ?? '';
    $dispatchToRaw = $changeData['original_end_date'] ?? $details['dispatch_to'] ?? '';
    $dispatchFrom = $formatEmailDate($dispatchFromRaw);
    $dispatchTo = $formatEmailDate($dispatchToRaw);
    $dispatchDates = trim($dispatchFrom . ($dispatchFrom !== '' && $dispatchTo !== '' ? ' — ' : '') . $dispatchTo);

    $dispatchRequestId = (int)($details['request_id'] ?? 0);
    $dispatchRef = $dispatchRequestId > 0
        ? 'REQ-' . str_pad((string)$dispatchRequestId, 5, '0', STR_PAD_LEFT)
        : '';
    $dispatchRefEscaped = $escape($dispatchRef);

    $changeRequestId = (int)($changeData['change_request_id'] ?? 0);
    $changeDisplayId = trim((string)($changeData['display_id'] ?? ''));
    if ($changeDisplayId === '' && $changeRequestId > 0) {
        $changeDisplayId = 'CR-' . str_pad((string)$changeRequestId, 5, '0', STR_PAD_LEFT);
    }
    $changeDisplayIdEscaped = $escape($changeDisplayId);

    $deepLinkQuery = 'type=cancellation&openChangeRequestId=' . rawurlencode((string)$changeRequestId);
    $kdtCtaUrl = $escape($link . '/PCS/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $khiCtaUrl = $escape($link . '/PCSKHI/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $logoUrl = $escape($link) . '/PCSKHI/images/' . rawurlencode('pcs logo bold.png');

    // Cancellation pink/rose badge from Toraberu cancellation UI (#DF55A2), black text.
    $crBadge = $changeDisplayIdEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#DF55A2;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$changeDisplayIdEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";
    $reqBadge = $dispatchRefEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4ADE80;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$dispatchRefEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";

    return "
<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>Cancellation Request Submitted</title>
</head>
<body style=\"margin:0;padding:0;background-color:#F9F9F9;color:#000000;\">
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:collapse;background-color:#F9F9F9;width:100%;\">
    <tr>
        <td align=\"center\" bgcolor=\"#F9F9F9\" style=\"padding:24px 12px;background-color:#F9F9F9;\">
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;font-family:Arial, Helvetica, sans-serif;\">
                <tr>
                    <td style=\"padding:28px 34px 24px 34px;border-bottom:1px solid #E9E9E9;\">
                        <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"128\" style=\"display:block;width:128px;max-width:100%;height:auto;border:0;\">
                    </td>
                </tr>
                <tr>
                    <td style=\"padding:30px 34px 26px 34px;\">
                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                            <tr>
                                <td style=\"font-size:32px;line-height:34px;font-weight:700;color:#000000;padding:0;\">
                                    Cancellation<br>Request Submitted
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:36px;\">
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\">Dear President {$presidentSurname}-san,</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0;\">A dispatch cancellation request has been submitted by <strong>{$requesterSurname}-san</strong>.</td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:28px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td colspan=\"2\" bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 10px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">Cancellation Request Summary</td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">NAME</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">{$employeeName}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">LOCATION</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($locationName !== '' ? $locationName : '—') . "</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">CANCELLATION REQUEST ID</div>
                                    <div style=\"line-height:1.45;\">{$crBadge}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">ORIGINAL DISPATCH ID</div>
                                    <div style=\"line-height:1.45;\">{$reqBadge}</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 16px 16px;border-right:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">GROUP</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($groupAbbr !== '' ? $groupAbbr : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 16px 14px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DISPATCH DATES</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($dispatchDates !== '' ? $dispatchDates : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:12px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:14px 16px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">REASON FOR CANCELLATION</div>
                                    <div style=\"font-size:13px;line-height:20px;font-weight:700;color:#000000;word-break:break-word;\">" . ($reason !== '' ? $reason : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td>
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-right:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KDT</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#000000\" style=\"background-color:#000000;border-radius:8px;\">
                                                            <a href=\"{$kdtCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#FFFFFF;text-decoration:none;text-align:center;border-radius:8px;\">View Cancellation Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-left:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KHI</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#4ADE80\" style=\"background-color:#4ADE80;border-radius:8px;\">
                                                            <a href=\"{$khiCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#000000;text-decoration:none;text-align:center;border-radius:8px;\">View Request Status&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td style=\"padding:0;\">
                                    <!--DISPATCH_EMAIL_TEST_MODE-->
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#E8E8E8\" style=\"border-collapse:separate;width:100%;margin-top:0;background-color:#E8E8E8;border-radius:9px;\">
                            <tr>
                                <td width=\"42\" valign=\"middle\" bgcolor=\"#E8E8E8\" style=\"width:42px;padding:13px 0 13px 15px;background-color:#E8E8E8;\">
                                    <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;\">
                                        <tr>
                                            <td align=\"center\" valign=\"middle\" style=\"width:18px;height:18px;border:1px solid #959595;border-radius:50%;color:#878787;font-size:11px;line-height:18px;font-weight:700;\">i</td>
                                        </tr>
                                    </table>
                                </td>
                                <td bgcolor=\"#E8E8E8\" style=\"padding:12px 15px 12px 4px;font-size:11px;line-height:16px;color:#7D7D7D;background-color:#E8E8E8;\">
                                    This is a system-generated email. Please do not reply to this message.<br>
                                    If you need assistance, contact your トラべる administrator.
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:24px;\">
                            <tr>
                                <td>
                                    <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"84\" style=\"display:block;width:84px;max-width:100%;height:auto;border:0;\">
                                    <div style=\"margin-top:9px;font-size:11px;line-height:14px;color:#7D7D7D;\">KHI Design &amp; Technical Service, Inc.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
";
}

function emailCancellationRequest(array $details, array $changeData = []): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $subject = 'Dispatch Cancellation Request Notification';
    $msg = buildCancellationRequestSubmittedEmailHtml($details, $changeData, $recipients);
    return sendDispatchNotificationEmail($subject, $msg, $recipients);
}

function buildDateChangeRequestWithdrawnEmailHtml(array $details, array $changeData, array $recipients): string
{
    $presdata = $recipients["presdata"] ?? [];
    $khidetails = $recipients["khidetails"] ?? [];
    $link = (string)($recipients["link"] ?? 'https://kdt-ph.kdts.net');

    $escape = static function ($value): string {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    };
    $formatEmailDate = static function ($date) use ($escape): string {
        $raw = trim((string)$date);
        if ($raw === '') {
            return '';
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $escape($raw);
        }
        return $escape(date('d M Y', $ts));
    };
    $formatNetChangeValue = static function (int $currentDays, int $proposedDays): string {
        $diff = $proposedDays - $currentDays;
        if ($diff === 0) {
            return '0';
        }
        if ($diff > 0) {
            return '+' . $diff;
        }
        return (string)$diff;
    };

    $presidentSurname = $escape($presdata['surname'] ?? '');
    $requesterSurname = $escape(ucwords(strtolower((string)($khidetails['surname'] ?? ''))));
    $employeeName = $escape(getName($details['emp_number']));
    $locationName = $escape(getLocationName($details['location_id']));
    $groupAbbr = $escape(getGroupAbbreviation($details['emp_group'] ?? 0));

    $originalFromRaw = $changeData['original_start_date'] ?? $details['dispatch_from'] ?? '';
    $originalToRaw = $changeData['original_end_date'] ?? $details['dispatch_to'] ?? '';
    $proposedFromRaw = $changeData['requested_start_date'] ?? '';
    $proposedToRaw = $changeData['requested_end_date'] ?? '';
    $reason = $escape($changeData['reason'] ?? '');

    $originalFrom = $formatEmailDate($originalFromRaw);
    $originalTo = $formatEmailDate($originalToRaw);
    $proposedFrom = $formatEmailDate($proposedFromRaw);
    $proposedTo = $formatEmailDate($proposedToRaw);
    $dispatchDates = trim($originalFrom . ($originalFrom !== '' && $originalTo !== '' ? ' — ' : '') . $originalTo);
    $approvedDates = trim($originalFrom . ($originalFrom !== '' && $originalTo !== '' ? ' - ' : '') . $originalTo);
    $proposedDates = trim($proposedFrom . ($proposedFrom !== '' && $proposedTo !== '' ? ' - ' : '') . $proposedTo);

    $currentDays = ($originalFromRaw !== '' && $originalToRaw !== '')
        ? countDays($originalFromRaw, $originalToRaw)
        : 0;
    $proposedDays = ($proposedFromRaw !== '' && $proposedToRaw !== '')
        ? countDays($proposedFromRaw, $proposedToRaw)
        : 0;
    $netChange = $formatNetChangeValue((int)$currentDays, (int)$proposedDays);

    $dispatchRequestId = (int)($details['request_id'] ?? 0);
    $dispatchRef = $dispatchRequestId > 0
        ? 'REQ-' . str_pad((string)$dispatchRequestId, 5, '0', STR_PAD_LEFT)
        : '';
    $dispatchRefEscaped = $escape($dispatchRef);

    $changeRequestId = (int)($changeData['change_request_id'] ?? 0);
    $changeDisplayId = trim((string)($changeData['display_id'] ?? ''));
    if ($changeDisplayId === '' && $changeRequestId > 0) {
        $changeDisplayId = 'DCR-' . str_pad((string)$changeRequestId, 5, '0', STR_PAD_LEFT);
    }
    $changeDisplayIdEscaped = $escape($changeDisplayId);

    $deepLinkQuery = 'type=date_change&openChangeRequestId=' . rawurlencode((string)$changeRequestId);
    $kdtCtaUrl = $escape($link . '/PCS/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $khiCtaUrl = $escape($link . '/PCSKHI/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $logoUrl = $escape($link) . '/PCSKHI/images/' . rawurlencode('pcs logo bold.png');
    $undoIconUrl = $escape($link) . '/PCSKHI/images/undo-2.png';

    $dcBadge = $changeDisplayIdEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4F39F6;color:#FFFFFF;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$changeDisplayIdEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";
    $reqBadge = $dispatchRefEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4ADE80;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$dispatchRefEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";

    return "
<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>Date Change Request Withdrawn</title>
</head>
<body style=\"margin:0;padding:0;background-color:#F9F9F9;color:#000000;\">
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:collapse;background-color:#F9F9F9;width:100%;\">
    <tr>
        <td align=\"center\" bgcolor=\"#F9F9F9\" style=\"padding:24px 12px;background-color:#F9F9F9;\">
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;font-family:Arial, Helvetica, sans-serif;\">
                <tr>
                    <td style=\"padding:28px 34px 24px 34px;border-bottom:1px solid #E9E9E9;\">
                        <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"128\" style=\"display:block;width:128px;max-width:100%;height:auto;border:0;\">
                    </td>
                </tr>
                <tr>
                    <td style=\"padding:30px 34px 26px 34px;\">
                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                            <tr>
                                <td style=\"font-size:32px;line-height:34px;font-weight:700;color:#000000;padding:0;\">
                                    Date Change<br>Request Withdrawn
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:36px;\">
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\">Dear President {$presidentSurname}-san,</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\"><strong>{$requesterSurname}-san</strong> has withdrawn the date change request below.</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0;\"><strong>No action is required.</strong> The proposed date change will not be applied, and the currently approved dispatch dates remain unchanged.</td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:28px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td colspan=\"2\" bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 10px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">Date Change Request Summary</td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">NAME</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">{$employeeName}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">LOCATION</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($locationName !== '' ? $locationName : '—') . "</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DATE CHANGE REQUEST ID</div>
                                    <div style=\"line-height:1.45;\">{$dcBadge}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">ORIGINAL DISPATCH ID</div>
                                    <div style=\"line-height:1.45;\">{$reqBadge}</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 16px 16px;border-right:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">GROUP</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($groupAbbr !== '' ? $groupAbbr : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 16px 14px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DISPATCH DATES</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($dispatchDates !== '' ? $dispatchDates : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 12px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;background-color:#F9F9F9;\">Requested Schedule Change</td>
                            </tr>
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:0 12px 14px 12px;background-color:#F9F9F9;\">
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"44%\" valign=\"middle\" style=\"width:44%;\">
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:separate;width:100%;background-color:#FFFFFF;border:1px solid #E9E9E9;border-radius:10px;\">
                                                    <tr>
                                                        <td bgcolor=\"#FFFFFF\" style=\"padding:12px 12px 14px 12px;background-color:#FFFFFF;\">
                                                            <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">APPROVED DATES</div>
                                                            <div style=\"font-size:12px;line-height:17px;font-weight:700;color:#000000;word-break:break-word;margin:0 0 8px 0;\">" . ($approvedDates !== '' ? $approvedDates : '—') . "</div>
                                                            <div style=\"font-size:12px;line-height:16px;font-weight:700;color:#38B365;margin:0 0 6px 0;\">{$currentDays} days</div>
                                                            <div style=\"font-size:10px;line-height:13px;color:#878787;\">Remain unchanged</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"12%\" align=\"center\" valign=\"middle\" style=\"width:12%;padding:0 4px;\">
                                                <img src=\"{$undoIconUrl}\" alt=\"\" width=\"20\" height=\"20\" style=\"display:block;border:0;width:20px;height:20px;margin:0 auto;\">
                                            </td>
                                            <td width=\"44%\" valign=\"middle\" style=\"width:44%;\">
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:separate;width:100%;background-color:#FFFFFF;border:1px solid #E9E9E9;border-radius:10px;\">
                                                    <tr>
                                                        <td bgcolor=\"#FFFFFF\" style=\"padding:12px 12px 14px 12px;background-color:#FFFFFF;\">
                                                            <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">WITHDRAWN PROPOSED DATES</div>
                                                            <div style=\"font-size:12px;line-height:17px;font-weight:700;color:#000000;word-break:break-word;margin:0 0 8px 0;\">" . ($proposedDates !== '' ? $proposedDates : '—') . "</div>
                                                            <div style=\"font-size:12px;line-height:16px;font-weight:700;color:#38B365;margin:0 0 6px 0;\">{$proposedDays} days</div>
                                                            <div style=\"font-size:10px;line-height:13px;color:#878787;\">Not applied</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:0 16px 16px 16px;background-color:#F9F9F9;\">
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;border-top:1px solid #E9E9E9;\">
                                        <tr>
                                            <td style=\"padding:12px 0 0 0;font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;\">NET CHANGE</td>
                                            <td align=\"right\" style=\"padding:12px 0 0 0;font-size:14px;line-height:16px;font-weight:700;color:#38B365;\">{$netChange}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:12px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:14px 16px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">REASON FOR DATE WITHDRAWAL</div>
                                    <div style=\"font-size:13px;line-height:20px;color:#000000;word-break:break-word;\">" . ($reason !== '' ? $reason : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td>
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-right:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KDT</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#000000\" style=\"background-color:#000000;border-radius:8px;\">
                                                            <a href=\"{$kdtCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#FFFFFF;text-decoration:none;text-align:center;border-radius:8px;\">View Date Change Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-left:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KHI</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#4ADE80\" style=\"background-color:#4ADE80;border-radius:8px;\">
                                                            <a href=\"{$khiCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#000000;text-decoration:none;text-align:center;border-radius:8px;\">View Date Change Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td style=\"padding:0;\">
                                    <!--DISPATCH_EMAIL_TEST_MODE-->
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#E8E8E8\" style=\"border-collapse:separate;width:100%;margin-top:0;background-color:#E8E8E8;border-radius:9px;\">
                            <tr>
                                <td width=\"42\" valign=\"middle\" bgcolor=\"#E8E8E8\" style=\"width:42px;padding:13px 0 13px 15px;background-color:#E8E8E8;\">
                                    <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;\">
                                        <tr>
                                            <td align=\"center\" valign=\"middle\" style=\"width:18px;height:18px;border:1px solid #959595;border-radius:50%;color:#878787;font-size:11px;line-height:18px;font-weight:700;\">i</td>
                                        </tr>
                                    </table>
                                </td>
                                <td bgcolor=\"#E8E8E8\" style=\"padding:12px 15px 12px 4px;font-size:11px;line-height:16px;color:#7D7D7D;background-color:#E8E8E8;\">
                                    This is a system-generated email. Please do not reply to this message.<br>
                                    If you need assistance, contact your トラべる administrator.
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:24px;\">
                            <tr>
                                <td>
                                    <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"84\" style=\"display:block;width:84px;max-width:100%;height:auto;border:0;\">
                                    <div style=\"margin-top:9px;font-size:11px;line-height:14px;color:#7D7D7D;\">KHI Design &amp; Technical Service, Inc.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
";
}

function buildCancellationRequestWithdrawnEmailHtml(array $details, array $changeData, array $recipients): string
{
    $presdata = $recipients["presdata"] ?? [];
    $khidetails = $recipients["khidetails"] ?? [];
    $link = (string)($recipients["link"] ?? 'https://kdt-ph.kdts.net');

    $escape = static function ($value): string {
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    };
    $formatEmailDate = static function ($date) use ($escape): string {
        $raw = trim((string)$date);
        if ($raw === '') {
            return '';
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $escape($raw);
        }
        return $escape(date('d M Y', $ts));
    };

    $presidentSurname = $escape($presdata['surname'] ?? '');
    $requesterSurname = $escape(ucwords(strtolower((string)($khidetails['surname'] ?? ''))));
    $employeeName = $escape(getName($details['emp_number']));
    $locationName = $escape(getLocationName($details['location_id']));
    $groupAbbr = $escape(getGroupAbbreviation($details['emp_group'] ?? 0));
    $reason = $escape($changeData['reason'] ?? '');

    $dispatchFromRaw = $changeData['original_start_date'] ?? $details['dispatch_from'] ?? '';
    $dispatchToRaw = $changeData['original_end_date'] ?? $details['dispatch_to'] ?? '';
    $dispatchFrom = $formatEmailDate($dispatchFromRaw);
    $dispatchTo = $formatEmailDate($dispatchToRaw);
    $dispatchDates = trim($dispatchFrom . ($dispatchFrom !== '' && $dispatchTo !== '' ? ' — ' : '') . $dispatchTo);

    $dispatchRequestId = (int)($details['request_id'] ?? 0);
    $dispatchRef = $dispatchRequestId > 0
        ? 'REQ-' . str_pad((string)$dispatchRequestId, 5, '0', STR_PAD_LEFT)
        : '';
    $dispatchRefEscaped = $escape($dispatchRef);

    $changeRequestId = (int)($changeData['change_request_id'] ?? 0);
    $changeDisplayId = trim((string)($changeData['display_id'] ?? ''));
    if ($changeDisplayId === '' && $changeRequestId > 0) {
        $changeDisplayId = 'CR-' . str_pad((string)$changeRequestId, 5, '0', STR_PAD_LEFT);
    }
    $changeDisplayIdEscaped = $escape($changeDisplayId);

    $deepLinkQuery = 'type=cancellation&openChangeRequestId=' . rawurlencode((string)$changeRequestId);
    $kdtCtaUrl = $escape($link . '/PCS/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $khiCtaUrl = $escape($link . '/PCSKHI/changeRequests/' . ($changeRequestId > 0 ? ('?' . $deepLinkQuery) : ''));
    $logoUrl = $escape($link) . '/PCSKHI/images/' . rawurlencode('pcs logo bold.png');

    $crBadge = $changeDisplayIdEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#DF55A2;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$changeDisplayIdEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";
    $reqBadge = $dispatchRefEscaped !== ''
        ? "<span style=\"display:inline-block;padding:4px 10px;background-color:#4ADE80;color:#000000;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;\">{$dispatchRefEscaped}</span>"
        : "<span style=\"color:#000000;font-size:13px;font-weight:700;\">—</span>";

    return "
<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\">
<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>Cancellation Request Withdrawn</title>
</head>
<body style=\"margin:0;padding:0;background-color:#F9F9F9;color:#000000;\">
<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:collapse;background-color:#F9F9F9;width:100%;\">
    <tr>
        <td align=\"center\" bgcolor=\"#F9F9F9\" style=\"padding:24px 12px;background-color:#F9F9F9;\">
            <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#FFFFFF\" style=\"border-collapse:collapse;width:100%;max-width:600px;background-color:#FFFFFF;font-family:Arial, Helvetica, sans-serif;\">
                <tr>
                    <td style=\"padding:28px 34px 24px 34px;border-bottom:1px solid #E9E9E9;\">
                        <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"128\" style=\"display:block;width:128px;max-width:100%;height:auto;border:0;\">
                    </td>
                </tr>
                <tr>
                    <td style=\"padding:30px 34px 26px 34px;\">
                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                            <tr>
                                <td style=\"font-size:32px;line-height:34px;font-weight:700;color:#000000;padding:0;\">
                                    Cancellation Request<br>Withdrawn
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:36px;\">
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\">Dear President {$presidentSurname}-san,</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0 0 14px 0;\"><strong>{$requesterSurname}-san</strong> has withdrawn the cancellation request below.</td>
                            </tr>
                            <tr>
                                <td style=\"font-size:13px;line-height:20px;color:#000000;padding:0;\"><strong>No action is required.</strong> The cancellation request has been closed and the original dispatch request remains unchanged.</td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:28px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:14px;\">
                            <tr>
                                <td colspan=\"2\" bgcolor=\"#F9F9F9\" style=\"padding:18px 16px 10px 16px;font-size:14px;line-height:18px;font-weight:700;color:#000000;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">Cancellation Request Summary</td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">NAME</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">{$employeeName}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">LOCATION</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($locationName !== '' ? $locationName : '—') . "</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 14px 16px;border-right:1px solid #E9E9E9;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">CANCELLATION REQUEST ID</div>
                                    <div style=\"line-height:1.45;\">{$crBadge}</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 14px 14px;border-bottom:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">ORIGINAL DISPATCH ID</div>
                                    <div style=\"line-height:1.45;\">{$reqBadge}</div>
                                </td>
                            </tr>
                            <tr>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 14px 16px 16px;border-right:1px solid #E9E9E9;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">GROUP</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($groupAbbr !== '' ? $groupAbbr : '—') . "</div>
                                </td>
                                <td width=\"50%\" valign=\"top\" bgcolor=\"#F9F9F9\" style=\"width:50%;padding:14px 16px 16px 14px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#959595;margin:0 0 6px 0;\">DISPATCH DATES</div>
                                    <div style=\"font-size:13px;line-height:18px;font-weight:700;color:#000000;word-break:break-word;\">" . ($dispatchDates !== '' ? $dispatchDates : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#F9F9F9\" style=\"border-collapse:separate;width:100%;margin-top:18px;background-color:#F9F9F9;border:1px solid #E9E9E9;border-radius:12px;\">
                            <tr>
                                <td bgcolor=\"#F9F9F9\" style=\"padding:14px 16px;background-color:#F9F9F9;\">
                                    <div style=\"font-size:10px;line-height:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9E9E9E;margin:0 0 8px 0;\">REASON FOR WITHDRAWAL</div>
                                    <div style=\"font-size:13px;line-height:20px;font-weight:700;color:#000000;word-break:break-word;\">" . ($reason !== '' ? $reason : '—') . "</div>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td>
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                        <tr>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-right:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KDT</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#000000\" style=\"background-color:#000000;border-radius:8px;\">
                                                            <a href=\"{$kdtCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#FFFFFF;text-decoration:none;text-align:center;border-radius:8px;\">View Cancellation Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width=\"50%\" valign=\"top\" align=\"center\" style=\"width:50%;padding-left:6px;\">
                                                <div style=\"margin:0 0 7px 0;font-size:10px;line-height:12px;font-weight:700;letter-spacing:0.04em;color:#959595;\">FOR KHI</div>
                                                <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;\">
                                                    <tr>
                                                        <td align=\"center\" bgcolor=\"#4ADE80\" style=\"background-color:#4ADE80;border-radius:8px;\">
                                                            <a href=\"{$khiCtaUrl}\" style=\"display:block;padding:12px 10px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#000000;text-decoration:none;text-align:center;border-radius:8px;\">View Cancellation Request&nbsp;&nbsp;→</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:30px;\">
                            <tr>
                                <td style=\"padding:0;\">
                                    <!--DISPATCH_EMAIL_TEST_MODE-->
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#E8E8E8\" style=\"border-collapse:separate;width:100%;margin-top:0;background-color:#E8E8E8;border-radius:9px;\">
                            <tr>
                                <td width=\"42\" valign=\"middle\" bgcolor=\"#E8E8E8\" style=\"width:42px;padding:13px 0 13px 15px;background-color:#E8E8E8;\">
                                    <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;\">
                                        <tr>
                                            <td align=\"center\" valign=\"middle\" style=\"width:18px;height:18px;border:1px solid #959595;border-radius:50%;color:#878787;font-size:11px;line-height:18px;font-weight:700;\">i</td>
                                        </tr>
                                    </table>
                                </td>
                                <td bgcolor=\"#E8E8E8\" style=\"padding:12px 15px 12px 4px;font-size:11px;line-height:16px;color:#7D7D7D;background-color:#E8E8E8;\">
                                    This is a system-generated email. Please do not reply to this message.<br>
                                    If you need assistance, contact your トラべる administrator.
                                </td>
                            </tr>
                        </table>

                        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;width:100%;margin-top:24px;\">
                            <tr>
                                <td>
                                    <img src=\"{$logoUrl}\" alt=\"トラべる\" width=\"84\" style=\"display:block;width:84px;max-width:100%;height:auto;border:0;\">
                                    <div style=\"margin-top:9px;font-size:11px;line-height:14px;color:#7D7D7D;\">KHI Design &amp; Technical Service, Inc.</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
";
}

function emailChangeRequestWithdrawn(array $details, array $changeData): bool
{
    $recipients = buildDispatchEmailRecipients($details);
    $changeType = strtolower(trim((string)($changeData['change_type'] ?? '')));
    $isCancellation = $changeType === 'cancellation';
    $typeTitle = $isCancellation ? 'Cancellation' : 'Date Change';
    $subject = "Dispatch {$typeTitle} Request Withdrawn";

    if ($isCancellation) {
        $msg = buildCancellationRequestWithdrawnEmailHtml($details, $changeData, $recipients);
        return sendDispatchNotificationEmail($subject, $msg, $recipients);
    }

    $msg = buildDateChangeRequestWithdrawnEmailHtml($details, $changeData, $recipients);
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
