<?php

function getDashboardMemberIds(PDO $connpcs, PDO $connnew, int $userId): array
{
    if (hasAllGroupAccess($connpcs, $userId)) {
        $sql = "
            SELECT `id`
            FROM `employee_list`
            WHERE `emp_status` = 1
              AND `nickname` <> ''
              AND (
                    `resignation_date` IS NULL
                    OR `resignation_date` = '0000-00-00'
                    OR `resignation_date` > :yearMonth
              )
            ORDER BY `id`
        ";

        $stmt = $connnew->prepare($sql);
        $stmt->execute([
            ':yearMonth' => date('Y-m-01'),
        ]);

        return array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id'));
    }

    $groups = getUserGroups($connpcs, $userId);
    $groupIds = array_column($groups, 'id');

    if (empty($groupIds)) {
        return [];
    }

    $groupPlaceholders = [];
    $params = [
        ':yearMonth' => date('Y-m-01'),
    ];

    foreach ($groupIds as $index => $groupId) {
        $placeholder = ':group_' . $index;
        $groupPlaceholders[] = $placeholder;
        $params[$placeholder] = (int) $groupId;
    }

    $sql = "
        SELECT `id`
        FROM `employee_list`
        WHERE `group_id` IN (" . implode(', ', $groupPlaceholders) . ")
          AND `emp_status` = 1
          AND `nickname` <> ''
          AND (
                `resignation_date` IS NULL
                OR `resignation_date` = '0000-00-00'
                OR `resignation_date` > :yearMonth
          )
        ORDER BY `id`
    ";

    $stmt = $connnew->prepare($sql);
    $stmt->execute($params);

    return array_values(array_unique(
        array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id'))
    ));
}

function getDashboardDispatchList(PDO $connpcs, PDO $connnew, int $userId): array
{
    $memberIds = getDashboardMemberIds($connpcs, $connnew, $userId);

    if (empty($memberIds)) {
        return [];
    }

    $passportWarningMonths = envInt('PASSPORT_EXPIRY_WARNING_MONTHS', 9);
    $visaWarningMonths = envInt('VISA_EXPIRY_WARNING_MONTHS', 6);
    $reentryWarningMonths = envInt('REENTRY_PERMIT_EXPIRY_WARNING_MONTHS', 6);

    if ($passportWarningMonths < 1) {
        $passportWarningMonths = 9;
    }

    if ($visaWarningMonths < 1) {
        $visaWarningMonths = 6;
    }

    if ($reentryWarningMonths < 1) {
        $reentryWarningMonths = 6;
    }

    $passportWarningCutoff = strtotime('+' . $passportWarningMonths . ' months');
    $visaWarningCutoff = strtotime('+' . $visaWarningMonths . ' months');
    $reentryWarningCutoff = strtotime('+' . $reentryWarningMonths . ' months');

    $memberPlaceholders = [];
    $params = [
        ':dateFilter' => date('Y-m-d'),
    ];

    foreach ($memberIds as $index => $memberId) {
        $placeholder = ':member_' . $index;
        $memberPlaceholders[] = $placeholder;
        $params[$placeholder] = (int) $memberId;
    }

    $sql = "
        SELECT
            CONCAT(el.`firstname`, ' ', el.`surname`) AS `ename`,
            ll.`location_name`,
            dl.`dispatch_from`,
            dl.`dispatch_to`,

            pd.`passport_expiry`,
            pd.`on_process` AS `passport_on_process`,

            vd.`visa_expiry`,
            vd.`on_process` AS `visa_on_process`,

            rd.`permit_expiry`,
            rd.`on_process` AS `reentry_on_process`

        FROM `dispatch_list` AS dl
        INNER JOIN `kdtphdb_new`.`employee_list` AS el
            ON dl.`emp_number` = el.`id`
        INNER JOIN `location_list` AS ll
            ON dl.`location_id` = ll.`location_id`

        LEFT JOIN `passport_details` AS pd
            ON pd.`emp_number` = el.`id`

        LEFT JOIN `visa_details` AS vd
            ON vd.`emp_number` = el.`id`

        LEFT JOIN `reentry_permit_details` AS rd
            ON rd.`emp_number` = el.`id`

        WHERE dl.`dispatch_to` >= :dateFilter
          AND el.`emp_status` = 1
          AND el.`id` IN (" . implode(', ', $memberPlaceholders) . ")

        ORDER BY dl.`dispatch_id` DESC
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $dispatchList = [];

    foreach ($rows as $row) {
        $dispatchTo = $row['dispatch_to'];

        $passportStatus = 'invalid';
        $visaStatus = 'invalid';
        $reentryStatus = 'invalid';

        if ((int)($row['passport_on_process'] ?? 0) === 1) {
            $passportStatus = 'on_process';
        } elseif (!empty($row['passport_expiry']) && strtotime($row['passport_expiry']) >= strtotime($dispatchTo)) {
            $passportExpiryTs = strtotime($row['passport_expiry']);
            $passportStatus = ($passportExpiryTs <= $passportWarningCutoff) ? 'valid_expiring' : 'valid';
        }

        if ((int)($row['visa_on_process'] ?? 0) === 1) {
            $visaStatus = 'on_process';
        } elseif (!empty($row['visa_expiry']) && strtotime($row['visa_expiry']) >= strtotime($dispatchTo)) {
            $visaExpiryTs = strtotime($row['visa_expiry']);
            $visaStatus = ($visaExpiryTs <= $visaWarningCutoff) ? 'valid_expiring' : 'valid';
        }

        if ((int)($row['reentry_on_process'] ?? 0) === 1) {
            $reentryStatus = 'on_process';
        } elseif (!empty($row['permit_expiry']) && strtotime($row['permit_expiry']) >= strtotime($dispatchTo)) {
            $reentryExpiryTs = strtotime($row['permit_expiry']);
            $reentryStatus = ($reentryExpiryTs <= $reentryWarningCutoff) ? 'valid_expiring' : 'valid';
        }

        $dispatchList[] = [
            'name' => ucwords(strtolower((string)$row['ename'])),
            'location' => $row['location_name'],
            'from' => date('d M Y', strtotime($row['dispatch_from'])),
            'to' => date('d M Y', strtotime($dispatchTo)),
            'passportStatus' => $passportStatus,
            'visaStatus' => $visaStatus,
            'reentryStatus' => $reentryStatus,
        ];
    }

    return $dispatchList;
}

function getDashboardSummary(PDO $connpcs): array
{
    $year = (int) date('Y');
    $summary = [];

    for ($month = 1; $month <= 12; $month++) {
        $monthEndDate = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $year, $month)));

        $sql = "
            SELECT COUNT(*) AS total
            FROM `dispatch_list`
            WHERE :monthEndDate BETWEEN `dispatch_from` AND `dispatch_to`
        ";

        $stmt = $connpcs->prepare($sql);
        $stmt->execute([
            ':monthEndDate' => $monthEndDate,
        ]);

        $dateObj = DateTime::createFromFormat('!m', (string) $month);

        $summary[] = [
            'month' => $dateObj->format('F'),
            'rate' => (int) $stmt->fetchColumn(),
        ];
    }

    return $summary;
}

function getExpiringPassports(PDO $connpcs, PDO $connnew, int $userId): array
{
    $memberIds = getDashboardMemberIds($connpcs, $connnew, $userId);

    if (empty($memberIds)) {
        return [];
    }

    $months = envInt('PASSPORT_EXPIRY_WARNING_MONTHS', 10);
    if ($months < 1) {
        $months = 10;
    }

    $memberPlaceholders = [];
    $params = [];

    foreach ($memberIds as $index => $memberId) {
        $placeholder = ':member_' . $index;
        $memberPlaceholders[] = $placeholder;
        $params[$placeholder] = (int) $memberId;
    }

    $sql = "
        SELECT
            CONCAT(el.`firstname`, ' ', el.`surname`) AS `ename`,
            el.`id`,
            TIMESTAMPDIFF(DAY, CURDATE(), pd.`passport_expiry`) AS `expiring_in`
        FROM `passport_details` AS pd
        INNER JOIN `kdtphdb_new`.`employee_list` AS el
            ON pd.`emp_number` = el.`id`
        WHERE el.`id` IN (" . implode(', ', $memberPlaceholders) . ")
          AND pd.`passport_expiry` >= CURDATE()
          AND pd.`passport_expiry` <= DATE_ADD(CURDATE(), INTERVAL :months MONTH)
          AND el.`emp_status` = 1
        ORDER BY pd.`passport_expiry` ASC
    ";

    $params[':months'] = $months;

    $stmt = $connpcs->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($rows as $row) {
        $days = (int) $row['expiring_in'];
        if ($days < 0) {
            $days = 0;
        }

        $result[] = [
            'name' => ucwords(strtolower((string)$row['ename'])),
            'id' => (int) $row['id'],
            'until' => $days,
        ];
    }

    return $result;
}

function getExpiringVisas(PDO $connpcs, PDO $connnew, int $userId): array
{
    $memberIds = getDashboardMemberIds($connpcs, $connnew, $userId);

    if (empty($memberIds)) {
        return [];
    }

    $warningMonths = envInt('VISA_EXPIRY_WARNING_MONTHS', 7);

    if ($warningMonths < 1) {
        $warningMonths = 7;
    }

    $memberPlaceholders = [];
    $params = [];

    foreach ($memberIds as $index => $memberId) {
        $placeholder = ':member_' . $index;
        $memberPlaceholders[] = $placeholder;
        $params[$placeholder] = (int) $memberId;
    }

    $sql = "
        SELECT
            CONCAT(el.`firstname`, ' ', el.`surname`) AS `ename`,
            TIMESTAMPDIFF(DAY, CURDATE(), vd.`visa_expiry`) AS `expiring_in`,
            el.`id`
        FROM `visa_details` AS vd
        INNER JOIN `kdtphdb_new`.`employee_list` AS el
            ON vd.`emp_number` = el.`id`
        WHERE vd.`visa_expiry` >= CURDATE()
          AND vd.`visa_expiry` <= DATE_ADD(CURDATE(), INTERVAL {$warningMonths} MONTH)
          AND el.`emp_status` = 1
          AND el.`id` IN (" . implode(', ', $memberPlaceholders) . ")
        ORDER BY vd.`visa_expiry` ASC, el.`firstname` ASC, el.`surname` ASC
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $expiringList = [];

    foreach ($rows as $row) {
        $until = (int) $row['expiring_in'];

        if ($until < 0) {
            $until = 0;
        }

        $expiringList[] = [
            'name' => ucwords(strtolower((string) $row['ename'])),
            'id' => (int) $row['id'],
            'until' => $until,
        ];
    }

    return $expiringList;
}