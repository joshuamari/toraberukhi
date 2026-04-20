<?php

function getAvailableReportYears(PDO $connpcs): array
{
    $currentYear = (int) date('Y');

    $sql = "
        SELECT DISTINCT YEAR(dispatch_from) AS year_value
        FROM dispatch_list

        UNION

        SELECT DISTINCT YEAR(dispatch_to) AS year_value
        FROM dispatch_list
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $years = [];

    foreach ($rows as $year) {
        if ($year !== null) {
            $years[] = (int) $year;
        }
    }

    if (!in_array($currentYear, $years, true)) {
        $years[] = $currentYear;
    }

    sort($years);

    return array_values($years);
}

function getDispatchReport(
    PDO $connpcs,
    PDO $connnew,
    int $userId,
    string $selectedYear,
    ?string $groupId
): array {
    if (!preg_match('/^\d{4}$/', $selectedYear)) {
        throw new RuntimeException('Invalid year selected.', 400);
    }

    $accessibleGroupIds = getAccessibleGroupIds($connpcs, $userId);

    if (empty($accessibleGroupIds)) {
        return [];
    }

    $selectedGroupIds = array_values(array_map('intval', $accessibleGroupIds));

    if ($groupId !== null && $groupId !== '' && $groupId !== '0') {
        if (!ctype_digit((string) $groupId)) {
            throw new RuntimeException('Invalid group ID.', 400);
        }

        $gid = (int) $groupId;

        if (!in_array($gid, $selectedGroupIds, true)) {
            throw new RuntimeException('Access denied.', 403);
        }

        $selectedGroupIds = [$gid];
    }

    $reportStart = $selectedYear . '-01-01';
    $reportEnd = $selectedYear . '-12-31';

    $groupPlaceholders = implode(',', array_fill(0, count($selectedGroupIds), '?'));

    $groupSql = "
        SELECT
            gl.id,
            gl.name
        FROM kdtphdb_new.group_list gl
        WHERE gl.id IN ($groupPlaceholders)
        ORDER BY gl.name
    ";

    $groupStmt = $connnew->prepare($groupSql);
    $groupStmt->execute($selectedGroupIds);
    $groups = $groupStmt->fetchAll(PDO::FETCH_ASSOC);

    $finalReport = [];

    foreach ($groups as $groupRow) {
        $oneGroupID = (int) $groupRow['id'];
        $groupName = $groupRow['name'];

        $employeeSql = "
            SELECT
                el.id,
                CONCAT(UPPER(el.surname), ', ', el.firstname) AS empName,
                gl.abbreviation AS groupName,
                vd.visa_issue AS visaIssue,
                vd.visa_expiry AS visaExpiry,
                rd.permit_expiry AS reentryExpiry
            FROM kdtphdb_new.employee_list el
            LEFT JOIN kdtphdb_new.group_list gl
                ON el.group_id = gl.id
            LEFT JOIN visa_details vd
                ON el.id = vd.emp_number
            LEFT JOIN reentry_permit_details rd
                ON el.id = rd.emp_number
            WHERE el.group_id = :groupId
              AND (
                    el.date_hired IS NULL
                    OR el.date_hired = '0000-00-00'
                    OR el.date_hired <= :reportEnd
              )
              AND (
                    el.resignation_date IS NULL
                    OR el.resignation_date = '0000-00-00'
                    OR el.resignation_date >= :reportStart
              )
            ORDER BY el.id
        ";

        $employeeStmt = $connpcs->prepare($employeeSql);
        $employeeStmt->execute([
            ':groupId' => $oneGroupID,
            ':reportStart' => $reportStart,
            ':reportEnd' => $reportEnd,
        ]);

        $employees = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($employees)) {
            continue;
        }

        $userArray = [];

        foreach ($employees as $employeeRow) {
            $empID = (int) $employeeRow['id'];

            $dispatchSql = "
                SELECT dispatch_from, dispatch_to
                FROM dispatch_list
                WHERE emp_number = :empID
                  AND (
                        (dispatch_from >= :startYear1 AND dispatch_from <= :endYear1)
                        OR
                        (dispatch_to <= :endYear2 AND dispatch_to >= :startYear2)
                  )
                ORDER BY dispatch_from DESC
            ";

            $dispatchStmt = $connpcs->prepare($dispatchSql);
            $dispatchStmt->execute([
                ':empID' => $empID,
                ':startYear1' => $reportStart,
                ':endYear1' => $reportEnd,
                ':startYear2' => $reportStart,
                ':endYear2' => $reportEnd,
            ]);

            $dispatchRows = $dispatchStmt->fetchAll(PDO::FETCH_ASSOC);

            $days = 0;
            $dispatchArray = [];

            foreach ($dispatchRows as $dispatchRow) {
                $fromDate = $dispatchRow['dispatch_from'];
                $toDate = $dispatchRow['dispatch_to'];

                $duration = countDispatchDaysWithinYear($fromDate, $toDate, $selectedYear);
                $days += $duration;

                $dispatchArray[] = [
                    'dispatch_from' => $fromDate ? date('d M Y', strtotime($fromDate)) : 'None',
                    'dispatch_to' => $toDate ? date('d M Y', strtotime($toDate)) : 'None',
                    'duration' => $duration,
                ];
            }

            $userArray[] = [
                'id' => $empID,
                'empName' => $employeeRow['empName'],
                'groupName' => $employeeRow['groupName'],
                'visaExpiry' => formatVisaSummary(
                    $employeeRow['visaIssue'] ?? null,
                    $employeeRow['visaExpiry'] ?? null
                ),
                'reentryExpiry' => formatReentrySummary(
                    $employeeRow['reentryExpiry'] ?? null
                ),
                'dispatch' => $dispatchArray,
                'totalDays' => $days,
            ];
        }

        $finalReport[$groupName] = $userArray;
    }

    return $finalReport;
}

function countDispatchDaysWithinYear(?string $dateFrom, ?string $dateTo, string $yearNow): int
{
    if (!$dateFrom || !$dateTo || $dateFrom > $dateTo) {
        return 0;
    }

    $dateFromYear = date('Y', strtotime($dateFrom));
    $dateToYear = date('Y', strtotime($dateTo));

    if ($dateFromYear != $yearNow && $dateToYear == $yearNow) {
        $startYear = $yearNow . '-01-01';
        $endYear = $dateTo;
    } elseif ($dateFromYear == $yearNow && $dateToYear == $yearNow) {
        $startYear = $dateFrom;
        $endYear = $dateTo;
    } elseif ($dateFromYear == $yearNow && $dateToYear != $yearNow) {
        $startYear = $dateFrom;
        $endYear = $yearNow . '-12-31';
    } else {
        $startYear = $yearNow . '-12-31';
        $endYear = $yearNow . '-12-31';
    }

    $startDate = new DateTime($startYear);
    $endDate = new DateTime($endYear);

    return $startDate->diff($endDate)->days + 1;
}

function convertSecondsToYears(int $secs): int
{
    $secs += 86400;
    $secondsInAYear = 365 * 24 * 60 * 60;

    return (int) floor($secs / $secondsInAYear);
}

function convertSecondsToMonths(int $secs): int
{
    $secs += 86400;
    $secondsInAMonth = 2628000;

    return (int) floor($secs / $secondsInAMonth);
}

function formatVisaSummary(?string $visaIssue, ?string $visaExpiry): string
{
    if (!$visaIssue || !$visaExpiry) {
        return 'None';
    }

    $vExp = strtotime($visaExpiry);
    $vIssue = strtotime($visaIssue);

    $difference = convertSecondsToYears($vExp - $vIssue);
    $visaDiff = $difference . ' year/s ';

    if ($difference === 0) {
        $difference = convertSecondsToMonths($vExp - $vIssue);
        $visaDiff = $difference . ' month/s ';
    }

    return 'ICT VISA ' . $visaDiff . date('m/d/Y', $vExp);
}

function formatReentrySummary(?string $reentryExpiry): string
{
    if (!$reentryExpiry) {
        return 'None';
    }

    return date('m/d/Y', strtotime($reentryExpiry));
}